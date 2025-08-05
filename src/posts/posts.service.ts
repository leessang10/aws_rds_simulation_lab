import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto, GetPostsDto, UpdatePostDto } from './posts.dto';

@Injectable()
export class PostsService {
    constructor(private prisma: PrismaService) {}

    async create(data: CreatePostDto) {
        return this.prisma.post.create({ data });
    }

    async findAll(query: GetPostsDto) {
        const { page, limit, title, authorName, status, type, sortBy, sortOrder } = query;

        const offset = (page - 1) * limit;

        const whereClause: any = {
            deletedAt: null, // 소프트 삭제된 게시물 제외
        };
        if (title) {
            whereClause.title = { contains: title };
        }
        if (authorName) {
            whereClause.author = { name: { contains: authorName } };
        }
        if (status) {
            whereClause.status = status;
        }
        if (type) {
            whereClause.type = type;
        }

        const totalPosts = await this.prisma.post.count({
            where: whereClause,
        });

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

    async findOne(id: number) {
        const post = await this.prisma.post.findFirst({
            where: { id, deletedAt: null },
            include: {
                author: true,
                Comment: true,
            },
        });
        if (!post) {
            throw new NotFoundException(`Post with ID ${id} not found`);
        }
        return post;
    }

    async update(id: number, data: UpdatePostDto) {
        await this.findOne(id); // Check if post exists
        return this.prisma.post.update({
            where: { id },
            data,
        });
    }

    async remove(id: number) {
        await this.findOne(id); // Check if post exists
        return this.prisma.post.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
}