import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from '../entities/post.entity';
import { PostsV1Controller } from './v1/posts-v1.controller';
import { PostsV1Service } from './v1/posts-v1.service';
import { PostsV2Controller } from './v2/posts-v2.controller';
import { PostsV2Service } from './v2/posts-v2.service';

@Module({
  imports: [TypeOrmModule.forFeature([Post])],
  providers: [PostsV1Service, PostsV2Service],
  controllers: [PostsV1Controller, PostsV2Controller],
})
export class PostsModule {}
