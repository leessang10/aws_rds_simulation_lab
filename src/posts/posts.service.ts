import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto, GetPostsDto, UpdatePostDto } from './posts.dto';

@Injectable()
export class PostsService {
    constructor(private prisma: PrismaService) {}

    async create(data: CreatePostDto) {
        return this.prisma.post.create({ data });
    }

    private getWhereClause(query: GetPostsDto) {
        const { title, authorName, status, type } = query;
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
        return whereClause;
    }

    async findAll(query: GetPostsDto) {
        const { page, limit, sortBy, sortOrder } = query;
        const offset = (page - 1) * limit;
        const whereClause = this.getWhereClause(query);

        return this.prisma.post.findMany({
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
    }

    async count(query: GetPostsDto) {
        const whereClause = this.getWhereClause(query);
        const totalPosts = await this.prisma.post.count({
            where: whereClause,
        });
        return { total: totalPosts };
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