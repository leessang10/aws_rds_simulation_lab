import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CountPostsDto,
  CountResponseDto,
  CursorPaginationDto,
  OptimizedCountResponseDto,
  PaginatedPostsResponseDto,
  PostResponseDto,
} from '../posts.dto';
import { PostsV2Service } from './posts-v2.service';

@ApiTags('posts-v2 (Optimized)')
@Controller('api/v2/posts')
export class PostsV2Controller {
  constructor(private readonly postsV2Service: PostsV2Service) {}

  @Get()
  @ApiOperation({
    summary:
      '[V2] Get posts with cursor-based pagination (optimized for large datasets)',
  })
  @ApiResponse({
    status: 200,
    description: 'Return cursor-paginated posts with optimized queries.',
    type: PaginatedPostsResponseDto,
  })
  async findAll(
    @Query() query: CursorPaginationDto,
  ): Promise<PaginatedPostsResponseDto> {
    const result = await this.postsV2Service.findAllCursor(query);
    return {
      data: result.data,
      nextCursor: result.nextCursor || undefined,
      hasMore: result.hasMore,
      count: result.data.length,
    };
  }

  @Get('count')
  @ApiOperation({
    summary: '[V2] Get exact count of posts with filtering (optimized query)',
  })
  @ApiResponse({
    status: 200,
    description: 'Return exact post count with optimized query.',
    type: CountResponseDto,
  })
  count(@Query() query: CountPostsDto): Promise<CountResponseDto> {
    return this.postsV2Service.count(query);
  }

  @Get('count/estimated')
  @ApiOperation({
    summary:
      '[V2] Get optimized count (uses estimation for better performance)',
  })
  @ApiResponse({
    status: 200,
    description:
      'Return post count (exact or estimated for better performance).',
    type: OptimizedCountResponseDto,
  })
  countOptimized(
    @Query() query: CountPostsDto,
  ): Promise<OptimizedCountResponseDto> {
    return this.postsV2Service.countOptimized(query);
  }

  @Get('search')
  @ApiOperation({
    summary: '[V2] Advanced search with full-text search capabilities',
  })
  @ApiResponse({
    status: 200,
    description: 'Return search results with full-text search optimization.',
    type: PaginatedPostsResponseDto,
  })
  async search(
    @Query() query: CursorPaginationDto,
  ): Promise<PaginatedPostsResponseDto> {
    // Force full-text search behavior for search endpoint
    const searchQuery = { ...query };
    if (searchQuery.title && !searchQuery.title.includes(' ')) {
      // Convert single word to phrase for better full-text search
      searchQuery.title = `"${searchQuery.title}"`;
    }

    const result = await this.postsV2Service.findAllCursor(searchQuery);
    return {
      data: result.data,
      nextCursor: result.nextCursor || undefined,
      hasMore: result.hasMore,
      count: result.data.length,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: '[V2] Get a post by ID (optimized - without comments)',
  })
  @ApiResponse({
    status: 200,
    description: 'Return the post with optimized loading.',
    type: PostResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Post not found.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.postsV2Service.findOneOptimized(id);
  }

  @Get(':id/full')
  @ApiOperation({
    summary: '[V2] Get a post by ID with comments (includes related data)',
  })
  @ApiResponse({
    status: 200,
    description: 'Return the post with comments and author information.',
    type: PostResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Post not found.' })
  findOneFull(@Param('id', ParseIntPipe) id: number) {
    return this.postsV2Service.findOne(id, true);
  }
}
