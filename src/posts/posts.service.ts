// src/posts/posts.service.ts

import { Injectable } from '@nestjs/common';
import {PrismaService} from "../prisma/prisma.service";
import {GetPostsDto} from "./posts.dto";

@Injectable()
export class PostsService {
    constructor(private prisma: PrismaService) {}

    async findAll(query: GetPostsDto) {
        const { page, limit, title, authorName, sortBy, sortOrder } = query;

        const offset = (page - 1) * limit;

        // 필터링 조건
        const whereClause: any = {};
        if (title) {
            whereClause.title = {
                contains: title,
            };
        }
        if (authorName) {
            whereClause.author = {
                name: {
                    contains: authorName,
                },
            };
        }

        // 전체 게시물 수 계산
        const totalPosts = await this.prisma.post.count({
            where: whereClause,
        });

        // 게시물 데이터 조회
        const posts = await this.prisma.post.findMany({
            skip: offset,
            take: limit,
            where: whereClause,
            orderBy: {
                [sortBy]: sortOrder,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                _count: {
                    select: { Comment: true },
                },
            },
        });

        return {
            data: posts,
            meta: {
                total: totalPosts,
                page,
                limit,
                lastPage: Math.ceil(totalPosts / limit),
            },
        };
    }
}