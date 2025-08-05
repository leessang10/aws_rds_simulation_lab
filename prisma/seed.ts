// aws_rds_simulation_lab/prisma/seed.ts

import { PrismaClient, PostStatus, PostType } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// Helper function to generate a random integer within a range
function getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
    console.log('--- Start Seeding ---');

    // 기존 데이터 삭제
    await prisma.comment.deleteMany();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();
    console.log('Existing data deleted.');

    const batchSize = 50_000;

    // --- 1. User 데이터 생성 (1천만건) ---
    const userCount = 10_000;
    console.log(`Generating ${userCount} users...`);
    for (let i = 0; i < userCount; i += batchSize) {
        const users: any[] = [];
        const limit = Math.min(batchSize, userCount - i);
        for (let j = 0; j < limit; j++) {
            users.push({
                email: faker.internet.email(),
                name: faker.person.fullName(),
            });
        }
        await prisma.user.createMany({ data: users, skipDuplicates: true });
        console.log(`Seeded ${i + limit} users...`);
    }
    console.log('User data seeded successfully.');

    // --- 2. Post 데이터 생성 (1천만건) ---
    const postCount = 10_000_000;
    const userRange = await prisma.user.aggregate({ _min: { id: true }, _max: { id: true } });
    const minUserId = userRange._min.id ?? 1;
    const maxUserId = userRange._max.id ?? userCount;

    console.log(`Generating ${postCount} posts...`);
    for (let i = 0; i < postCount; i += batchSize) {
        const posts: any[] = [];
        const limit = Math.min(batchSize, postCount - i);
        for (let j = 0; j < limit; j++) {
            posts.push({
                title: faker.lorem.sentence({ min: 3, max: 10 }),
                content: faker.lorem.paragraphs(2, '\n'),
                status: faker.helpers.arrayElement(Object.values(PostStatus)),
                type: faker.helpers.arrayElement(Object.values(PostType)),
                authorId: getRandomInt(minUserId, maxUserId),
            });
        }
        await prisma.post.createMany({ data: posts });
        console.log(`Seeded ${i + limit} posts...`);
    }
    console.log('Post data seeded successfully.');

    // --- 3. Comment 데이터 생성 (1천만건) ---
    const commentCount = 10_000_000;
    const postRange = await prisma.post.aggregate({ _min: { id: true }, _max: { id: true } });
    const minPostId = postRange._min.id ?? 1;
    const maxPostId = postRange._max.id ?? postCount;

    console.log(`Generating ${commentCount} comments...`);
    for (let i = 0; i < commentCount; i += batchSize) {
        const comments: any[] = [];
        const limit = Math.min(batchSize, commentCount - i);
        for (let j = 0; j < limit; j++) {
            comments.push({
                text: faker.lorem.sentence({ min: 5, max: 25 }),
                postId: getRandomInt(minPostId, maxPostId),
                authorId: getRandomInt(minUserId, maxUserId),
            });
        }
        await prisma.comment.createMany({ data: comments });
        console.log(`Seeded ${i + limit} comments...`);
    }
    console.log('Comment data seeded successfully.');

    console.log('--- Seeding finished. ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

