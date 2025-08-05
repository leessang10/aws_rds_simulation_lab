import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CountPostsDto,
  CountResponseDto,
  GetPostsDto,
  PostResponseDto,
} from '../posts.dto';
import { PostsV1Service } from './posts-v1.service';

@ApiTags('posts-v1 (Original)')
@Controller('api/v1/posts')
export class PostsV1Controller {
  constructor(private readonly postsV1Service: PostsV1Service) {}

  @Get()
  @ApiOperation({
    summary: '[V1] Get all posts with traditional pagination (OFFSET/LIMIT)',
  })
  @ApiResponse({
    status: 200,
    description: 'Return posts using traditional pagination.',
    type: [PostResponseDto],
  })
  findAll(@Query() query: GetPostsDto) {
    return this.postsV1Service.findAll(query);
  }

  @Get('count')
  @ApiOperation({
    summary: '[V1] Get the total count of posts (standard count query)',
  })
  @ApiResponse({
    status: 200,
    description: 'Return exact post count using standard query.',
    type: CountResponseDto,
  })
  count(@Query() query: CountPostsDto): Promise<CountResponseDto> {
    return this.postsV1Service.count(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '[V1] Get a post by ID (with all relations)' })
  @ApiResponse({
    status: 200,
    description: 'Return the post with all related data.',
    type: PostResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Post not found.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.postsV1Service.findOne(id);
  }
}
