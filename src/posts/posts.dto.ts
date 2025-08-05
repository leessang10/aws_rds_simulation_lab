import { IsOptional, IsInt, IsString, IsEnum, Min, Max, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, PartialType } from '@nestjs/swagger';

// 정렬 방향을 위한 Enum
enum SortOrder {
    asc = 'asc',
    desc = 'desc',
}

export enum PostStatus {
    DRAFT = 'DRAFT',
    PUBLISHED = 'PUBLISHED',
    ARCHIVED = 'ARCHIVED',
}

export enum PostType {
    NORMAL = 'NORMAL',
    NOTICE = 'NOTICE',
    EVENT = 'EVENT',
}

export class GetPostsDto {
    @ApiProperty({ description: '페이지 번호', required: false, default: 1 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    page: number = 1;

    @ApiProperty({ description: '페이지당 게시물 수', required: false, default: 20 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    @Type(() => Number)
    limit: number = 20;

    @ApiProperty({ description: '제목 검색', required: false })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiProperty({ description: '작성자 이름 검색', required: false })
    @IsOptional()
    @IsString()
    authorName?: string;

    @ApiProperty({ description: '게시물 상태 필터', required: false, enum: PostStatus })
    @IsOptional()
    @IsEnum(PostStatus)
    status?: PostStatus;

    @ApiProperty({ description: '게시물 유형 필터', required: false, enum: PostType })
    @IsOptional()
    @IsEnum(PostType)
    type?: PostType;

    @ApiProperty({ description: '정렬 기준', required: false, default: 'createdAt' })
    @IsOptional()
    @IsString()
    sortBy: 'id' | 'title' | 'createdAt' | 'updatedAt' = 'createdAt';

    @ApiProperty({ description: '정렬 순서', required: false, default: 'desc', enum: SortOrder })
    @IsOptional()
    @IsEnum(SortOrder)
    @IsString()
    sortOrder: 'asc' | 'desc' = 'desc';
}

export class CreatePostDto {
    @ApiProperty({ description: '게시물 제목' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ description: '게시물 내용', required: false })
    @IsString()
    @IsOptional()
    content?: string;

    @ApiProperty({ description: '작성자 ID' })
    @IsInt()
    authorId: number;

    @ApiProperty({ description: '게시물 상태', required: false, enum: PostStatus, default: PostStatus.DRAFT })
    @IsEnum(PostStatus)
    @IsOptional()
    status?: PostStatus;

    @ApiProperty({ description: '게시물 유형', required: false, enum: PostType, default: PostType.NORMAL })
    @IsEnum(PostType)
    @IsOptional()
    type?: PostType;
}

export class UpdatePostDto extends PartialType(CreatePostDto) {}