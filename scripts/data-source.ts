import { DataSource } from 'typeorm';
import { User } from '../src/entities/user.entity';
import { Post } from '../src/entities/post.entity';
import { Comment } from '../src/entities/comment.entity';

export const AppDataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '123123123',
    database: process.env.DB_DATABASE || 'test',
    entities: [User, Post, Comment],
    synchronize: false, // Migrations should be used in production
    logging: false
});
