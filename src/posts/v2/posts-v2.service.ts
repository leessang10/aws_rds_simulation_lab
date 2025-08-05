import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Post } from '../../entities/post.entity';
import {
  CountPostsDto,
  CountResponseDto,
  CursorPaginationDto,
  OptimizedCountResponseDto,
} from '../posts.dto';

@Injectable()
export class PostsV2Service {
  private readonly logger = new Logger('PostsV2Service');

  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
  ) {}

  private buildQuery(
    query: CursorPaginationDto | CountPostsDto,
    includeAuthor: boolean = true,
  ): SelectQueryBuilder<Post> {
    const qb = this.postsRepository
      .createQueryBuilder('post')
      .where('post.deletedAt IS NULL');

    if (includeAuthor) {
      qb.leftJoinAndSelect('post.author', 'author');
    }

    // Apply filters
    if (query.title) {
      // V2: Use full-text search if available, otherwise optimized LIKE
      if (query.title.includes(' ')) {
        qb.andWhere(
          'MATCH(post.title, post.content) AGAINST(:searchTerm IN NATURAL LANGUAGE MODE)',
          {
            searchTerm: query.title,
          },
        );
      } else {
        qb.andWhere('post.title LIKE :title', { title: `${query.title}%` });
      }
    }

    if (query.authorName) {
      qb.andWhere('author.name LIKE :authorName', {
        authorName: `${query.authorName}%`,
      });
    }

    if (query.status) {
      qb.andWhere('post.status = :status', { status: query.status });
    }

    if (query.type) {
      qb.andWhere('post.type = :type', { type: query.type });
    }

    return qb;
  }

  private applyPagination(
    qb: SelectQueryBuilder<Post>,
    query: CursorPaginationDto,
  ): SelectQueryBuilder<Post> {
    if (query.cursor) {
      // V2: Cursor-based pagination for better performance
      const cursorCondition =
        query.sortOrder === 'asc'
          ? `post.${query.sortBy} > :cursor`
          : `post.${query.sortBy} < :cursor`;
      qb.andWhere(cursorCondition, { cursor: query.cursor });
    }

    qb.orderBy(
      `post.${query.sortBy}`,
      query.sortOrder.toUpperCase() as 'ASC' | 'DESC',
    ).limit(query.limit);

    return qb;
  }

  async findAllCursor(query: CursorPaginationDto): Promise<{
    data: Post[];
    nextCursor: string | null;
    hasMore: boolean;
  }> {
    const qb = this.buildQuery(query, true);
    this.applyPagination(qb, query);

    // Get one extra record to check if there are more
    const results = await qb.limit(query.limit + 1).getMany();
    const hasMore = results.length > query.limit;
    const data = hasMore ? results.slice(0, -1) : results;

    const nextCursor =
      hasMore && data.length > 0
        ? String(data[data.length - 1][query.sortBy])
        : null;

    return { data, nextCursor, hasMore };
  }

  async count(query: CountPostsDto): Promise<CountResponseDto> {
    // V2: Optimized count query without unnecessary joins for author
    const qb = this.buildQuery(query, false);
    const total = await qb.getCount();
    return { total };
  }

  /**
   * ⚠️ WARNING: ESTIMATED COUNT IS INACCURATE - USE WITH CAUTION
   * 
   * This method provides estimated row counts which can be significantly inaccurate:
   * - MySQL's information_schema.tables.table_rows is an approximation
   * - Can return 0 even when millions of rows exist
   * - Values may be outdated or completely wrong
   * - Should NEVER be used when exact counts are required
   * 
   * 🔧 RECOMMENDED USE CASES:
   * - Dashboard statistics where rough numbers are acceptable
   * - UI pagination hints (showing "~1M results" instead of exact count)
   * - Performance monitoring where speed > accuracy
   * 
   * 🚫 DO NOT USE FOR:
   * - Business calculations requiring exact counts
   * - Financial or billing operations
   * - Data validation or integrity checks
   * - Any scenario where accuracy is critical
   * 
   * For accurate counts, always use the regular count() method instead.
   */
  async countOptimized(
    query: CountPostsDto,
  ): Promise<OptimizedCountResponseDto> {
    // V2: For very large datasets, attempt estimated count for better performance
    if (!query.title && !query.authorName && !query.status && !query.type) {
      try {
        // WARNING: This query returns MySQL's internal row estimate which is often inaccurate
        const result = await this.postsRepository.query(
          `SELECT table_rows as estimated_count 
           FROM information_schema.tables 
           WHERE table_schema = DATABASE() AND table_name = 'post'`,
        );
        
        const estimatedCount = result[0]?.estimated_count || 0;
        this.logger.warn(
          `Estimated count returned: ${estimatedCount}. This may be inaccurate and should not be used for critical operations.`
        );
        
        // If estimate seems too low (common issue), fall back to exact count
        if (estimatedCount === 0 || estimatedCount < 1000) {
          this.logger.warn('Estimated count appears too low, falling back to exact count for accuracy');
          const qb = this.buildQuery(query, false);
          const exactTotal = await qb.getCount();
          return { total: exactTotal, estimated: false };
        }
        
        return {
          total: estimatedCount,
          estimated: true,
        };
      } catch (error) {
        this.logger.error('Failed to get estimated count, falling back to exact count', error);
        // Fallback to exact count on error
        const qb = this.buildQuery(query, false);
        const total = await qb.getCount();
        return { total, estimated: false };
      }
    }

    // With filters, always get exact count (estimation not meaningful with filters)
    const qb = this.buildQuery(query, false);
    const total = await qb.getCount();
    return { total, estimated: false };
  }

  async findOne(id: number, includeComments: boolean = false): Promise<Post> {
    const qb = this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .where('post.id = :id', { id })
      .andWhere('post.deletedAt IS NULL');

    if (includeComments) {
      // V2: Optimized comment loading with proper joins
      qb.leftJoinAndSelect(
        'post.comments',
        'comments',
        'comments.deletedAt IS NULL',
      )
        .leftJoinAndSelect('comments.author', 'commentAuthor')
        .orderBy('comments.createdAt', 'DESC');
    }

    const post = await qb.getOne();
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
    return post;
  }

  async findOneOptimized(id: number): Promise<Post> {
    // V2: Optimized version without comments for faster loading
    return this.findOne(id, false);
  }
}
