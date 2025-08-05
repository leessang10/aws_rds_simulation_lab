// src/posts/posts.controller.ts

import { Controller, Get, Query } from '@nestjs/common';
import {GetPostsDto} from "./posts.dto";
import { PostsService } from './posts.service';


@Controller('posts')
export class PostsController {
    constructor(private readonly postsService: PostsService) {}

    @Get()
    findAll(@Query() query: GetPostsDto) {
        return this.postsService.findAll(query);
    }
}