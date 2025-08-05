import { IsOptional, IsInt, IsString, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

// 정렬 방향을 위한 Enum
enum SortOrder {
    asc = 'asc',
    desc = 'desc',
}

export class GetPostsDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    page: number = 1;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    @Type(() => Number)
    limit: number = 20;

    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    authorName?: string;

    @IsOptional()
    @IsString()
    sortBy: 'id' | 'title' | 'createdAt' = 'createdAt';

    @IsOptional()
    @IsEnum(SortOrder) // 'asc', 'desc'만 허용하는 Enum
    @IsString()
    sortOrder: 'asc' | 'desc' = 'desc';
}