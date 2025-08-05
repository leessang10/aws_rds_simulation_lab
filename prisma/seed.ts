// aws_rds_simulation_lab/prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Start Seeding ---');

    // 기존 데이터 삭제
    await prisma.comment.deleteMany();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();
    console.log('Existing data deleted.');

    const users: any[] = [];
    const posts: any[] = [];
    const comments: any[] = [];

    // --- 1. User 데이터 생성 (1천만건) ---
    const userCount = 10_000_000;
    console.log(`Generating ${userCount} users...`);
    const uniqueEmails = new Set<string>();

    while (uniqueEmails.size < userCount) {
        uniqueEmails.add(faker.internet.email());
    }

    uniqueEmails.forEach(email => {
        users.push({
            email: email,
            name: faker.person.fullName(),
        });
    });

    await prisma.user.createMany({ data: users });
    console.log('User data seeded successfully.');

    // --- 2. Post 데이터 생성 (1천만건) ---
    const postCount = 10_000_000;
    const userIds = (await prisma.user.findMany({ select: { id: true } })).map(u => u.id);
    console.log(`Generating ${postCount} posts...`);

    for (let i = 0; i < postCount; i++) {
        posts.push({
            title: faker.lorem.sentence(),
            content: faker.lorem.paragraphs(2, '\n'),
            published: faker.datatype.boolean(),
            authorId: faker.helpers.arrayElement(userIds),
        });
    }

    await prisma.post.createMany({ data: posts });
    console.log('Post data seeded successfully.');

    // --- 3. Comment 데이터 생성 (1천만건) ---
    const commentCount = 10_000_000;
    const postIds = (await prisma.post.findMany({ select: { id: true } })).map(p => p.id);
    console.log(`Generating ${commentCount} comments...`);

    for (let i = 0; i < commentCount; i++) {
        comments.push({
            text: faker.lorem.sentence(),
            postId: faker.helpers.arrayElement(postIds),
            authorId: faker.helpers.arrayElement(userIds),
        });
    }

    await prisma.comment.createMany({ data: comments });
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