import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Like, Repository } from 'typeorm';
import { Post } from '../entities/post.entity';
import { CreatePostDto, GetPostsDto, UpdatePostDto } from './posts.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
  ) {}

  async create(data: CreatePostDto): Promise<Post> {
    const post = this.postsRepository.create(data);
    return this.postsRepository.save(post);
  }

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
    return this.postsRepository.find({ ...options, relations: ['author'] });
  }

  async count(query: GetPostsDto): Promise<{ total: number }> {
    const options = this.getFindOptions(query);
    delete options.skip;
    delete options.take;
    const total = await this.postsRepository.count(options);
    return { total };
  }

  async findOne(id: number): Promise<Post> {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['author', 'comments'],
    });
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
    return post;
  }

  async update(id: number, data: UpdatePostDto): Promise<Post> {
    const post = await this.findOne(id);
    this.postsRepository.merge(post, data);
    return this.postsRepository.save(post);
  }

  async remove(id: number): Promise<void> {
    const result = await this.postsRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
  }
}
