import { AppDataSource } from './data-source';
import { User } from '../src/entities/user.entity';
import { Post, PostStatus, PostType } from '../src/entities/post.entity';
import { Comment } from '../src/entities/comment.entity';
import { faker } from '@faker-js/faker';

async function run() {
    await AppDataSource.initialize();
    console.log('--- Start Seeding ---');

    const userRepository = AppDataSource.getRepository(User);
    const postRepository = AppDataSource.getRepository(Post);
    const commentRepository = AppDataSource.getRepository(Comment);

    // Clear existing data
    await commentRepository.query('SET FOREIGN_KEY_CHECKS = 0;');
    await commentRepository.clear();
    await postRepository.clear();
    await userRepository.clear();
    await commentRepository.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('Existing data deleted.');

    const batchSize = 100000; // Adjust batch size as needed
    const totalUsers = 1000; // Reduced for faster seeding, adjust as needed
    const totalPosts = 100_000_00;
    const totalComments = 100_000_00;

    // Seed Users
    console.log(`Seeding ${totalUsers} users...`);
    const uniqueEmails = new Set<string>();
    while (uniqueEmails.size < totalUsers) {
        uniqueEmails.add(faker.internet.email());
    }
    const emailArray = Array.from(uniqueEmails);

    for (let i = 0; i < totalUsers; i += batchSize) {
        const users: Partial<User>[] = [];
        const batchEmails = emailArray.slice(i, i + batchSize);
        for (const email of batchEmails) {
            const createdAt = faker.date.past({ years: 2 });
            const updatedAt = faker.date.between({ from: createdAt, to: new Date() });
            users.push({
                email: email,
                name: faker.person.fullName(),
                createdAt: createdAt,
                updatedAt: updatedAt,
            });
        }
        await userRepository.insert(users);
        console.log(`Seeded ${i + batchEmails.length} users...`);
    }

    // Seed Posts
    console.log(`Seeding ${totalPosts} posts...`);
    const userIds = (await userRepository.find({ select: ['id'] })).map(u => u.id);
    for (let i = 0; i < totalPosts; i += batchSize) {
        const posts: Partial<Post>[] = [];
        for (let j = 0; j < batchSize; j++) {
            const createdAt = faker.date.past({ years: 2 });
            const updatedAt = faker.date.between({ from: createdAt, to: new Date() });
            posts.push({
                title: faker.lorem.sentence({ min: 3, max: 10 }),
                content: faker.lorem.paragraphs(2, '\n'),
                status: faker.helpers.arrayElement(Object.values(PostStatus)),
                type: faker.helpers.arrayElement(Object.values(PostType)),
                authorId: faker.helpers.arrayElement(userIds),
                createdAt: createdAt,
                updatedAt: updatedAt,
            });
        }
        await postRepository.insert(posts);
        console.log(`Seeded ${i + batchSize} posts...`);
    }

    // Seed Comments
    console.log(`Seeding ${totalComments} comments...`);
    const postIds = (await postRepository.find({ select: ['id'] })).map(p => p.id);
    for (let i = 0; i < totalComments; i += batchSize) {
        const comments: Partial<Comment>[] = [];
        for (let j = 0; j < batchSize; j++) {
            const createdAt = faker.date.past({ years: 2 });
            const updatedAt = faker.date.between({ from: createdAt, to: new Date() });
            comments.push({
                text: faker.lorem.sentence({ min: 5, max: 25 }),
                postId: faker.helpers.arrayElement(postIds),
                authorId: faker.helpers.arrayElement(userIds),
                createdAt: createdAt,
                updatedAt: updatedAt,
            });
        }
        await commentRepository.insert(comments);
        console.log(`Seeded ${i + batchSize} comments...`);
    }

    console.log('--- Seeding finished. ---');
    await AppDataSource.destroy();
}

run().catch(console.error);
