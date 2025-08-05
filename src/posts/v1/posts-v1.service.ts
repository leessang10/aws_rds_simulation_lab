import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Like, Repository } from 'typeorm';
import { Post } from '../../entities/post.entity';
import { CountPostsDto, CountResponseDto, GetPostsDto } from '../posts.dto';

@Injectable()
export class PostsV1Service {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
  ) {}

  private getFindOptions(query: GetPostsDto): FindManyOptions<Post> {
    const { page, limit, title, authorName, status, type, sortBy, sortOrder } =
      query;
    const where: FindManyOptions<Post>['where'] = {};

    if (title) {
      where.title = Like(`%${title}%`);
    }
    if (authorName) {
      where.author = { name: Like(`%${authorName}%`) };
    }
    if (status) {
      where.status = status;
    }
    if (type) {
      where.type = type;
    }

    return {
      where,
      order: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    };
  }

  async findAll(query: GetPostsDto): Promise<Post[]> {
    const options = this.getFindOptions(query);
    // V1: Uses separate queries (N+1 problem)
    return this.postsRepository.find({ ...options, relations: ['author'] });
  }

  async count(query: CountPostsDto): Promise<CountResponseDto> {
    const where: FindManyOptions<Post>['where'] = {};

    if (query.title) {
      where.title = Like(`%${query.title}%`);
    }
    if (query.authorName) {
      where.author = { name: Like(`%${query.authorName}%`) };
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.type) {
      where.type = query.type;
    }

    // V1: Standard count query with potential N+1 issues
    const total = await this.postsRepository.count({ where });
    return { total };
  }

  async findOne(id: number): Promise<Post> {
    // V1: Basic query with relations loading
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['author', 'comments', 'comments.author'],
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
    return post;
  }
}
