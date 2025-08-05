import { AppDataSource } from './data-source';
import { PostStatus, PostType } from '../src/entities/post.entity';
import { faker } from '@faker-js/faker';

async function run() {
    await AppDataSource.initialize();
    console.log('--- Start Seeding ---');

    const connection = AppDataSource;

    // Clear existing data
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
    await connection.query('TRUNCATE TABLE comment;');
    await connection.query('TRUNCATE TABLE post;');
    await connection.query('TRUNCATE TABLE user;');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('Existing data deleted.');

    const batchSize = 100000; // Optimized batch size for raw SQL
    const totalUsers = 10000;
    const totalPosts = 10000000;
    const totalComments = 10000000;

    // Seed Users with raw SQL bulk insert
    console.log(`Seeding ${totalUsers} users...`);
    const startUserTime = Date.now();
    
    for (let i = 0; i < totalUsers; i += batchSize) {
        const values: string[] = [];
        const currentBatchSize = Math.min(batchSize, totalUsers - i);
        
        for (let j = 0; j < currentBatchSize; j++) {
            const email = faker.internet.email().replace(/'/g, "''"); // Escape quotes
            const name = faker.person.fullName().replace(/'/g, "''");
            const createdAt = faker.date.past({ years: 2 }).toISOString().slice(0, 19).replace('T', ' ');
            const updatedAt = faker.date.between({ from: new Date(createdAt), to: new Date() }).toISOString().slice(0, 19).replace('T', ' ');
            
            values.push(`('${email}', '${name}', '${createdAt}', '${updatedAt}')`);
        }
        
        const sql = `INSERT INTO user (email, name, createdAt, updatedAt) VALUES ${values.join(', ')};`;
        await connection.query(sql);
        await connection.query('COMMIT;');
        
        console.log(`Seeded ${i + currentBatchSize} users... (${((Date.now() - startUserTime) / 1000).toFixed(1)}s)`);
    }

    // Get user IDs for foreign key references
    const userIds = (await connection.query('SELECT id FROM user ORDER BY id;')).map((row: any) => row.id);
    console.log(`User IDs range: ${userIds[0]} to ${userIds[userIds.length - 1]}`);

    // Seed Posts with raw SQL bulk insert
    console.log(`Seeding ${totalPosts} posts...`);
    const startPostTime = Date.now();
    const postStatusValues = Object.values(PostStatus);
    const postTypeValues = Object.values(PostType);
    
    for (let i = 0; i < totalPosts; i += batchSize) {
        const values: string[] = [];
        const currentBatchSize = Math.min(batchSize, totalPosts - i);
        
        for (let j = 0; j < currentBatchSize; j++) {
            const title = faker.lorem.sentence({ min: 3, max: 10 }).replace(/'/g, "''");
            const content = faker.lorem.paragraphs(2, '\\n').replace(/'/g, "''");
            const status = faker.helpers.arrayElement(postStatusValues);
            const type = faker.helpers.arrayElement(postTypeValues);
            const authorId = faker.helpers.arrayElement(userIds);
            const createdAt = faker.date.past({ years: 2 }).toISOString().slice(0, 19).replace('T', ' ');
            const updatedAt = faker.date.between({ from: new Date(createdAt), to: new Date() }).toISOString().slice(0, 19).replace('T', ' ');
            
            values.push(`('${title}', '${content}', '${status}', '${type}', ${authorId}, '${createdAt}', '${updatedAt}')`);
        }
        
        const sql = `INSERT INTO post (title, content, status, type, authorId, createdAt, updatedAt) VALUES ${values.join(', ')};`;
        await connection.query(sql);
        await connection.query('COMMIT;');
        
        console.log(`Seeded ${i + currentBatchSize} posts... (${((Date.now() - startPostTime) / 1000).toFixed(1)}s)`);
    }

    // Get post IDs for foreign key references
    const postIds = (await connection.query('SELECT id FROM post ORDER BY id LIMIT 1000000;')).map((row: any) => row.id);
    console.log(`Post IDs range: ${postIds[0]} to ${postIds[postIds.length - 1]} (sample: ${postIds.length})`);

    // Seed Comments with raw SQL bulk insert
    console.log(`Seeding ${totalComments} comments...`);
    const startCommentTime = Date.now();
    
    for (let i = 0; i < totalComments; i += batchSize) {
        const values: string[] = [];
        const currentBatchSize = Math.min(batchSize, totalComments - i);
        
        for (let j = 0; j < currentBatchSize; j++) {
            const text = faker.lorem.sentence({ min: 5, max: 25 }).replace(/'/g, "''");
            const postId = faker.helpers.arrayElement(postIds);
            const authorId = faker.helpers.arrayElement(userIds);
            const createdAt = faker.date.past({ years: 2 }).toISOString().slice(0, 19).replace('T', ' ');
            const updatedAt = faker.date.between({ from: new Date(createdAt), to: new Date() }).toISOString().slice(0, 19).replace('T', ' ');
            
            values.push(`('${text}', ${authorId}, ${postId}, '${createdAt}', '${updatedAt}')`);
        }
        
        const sql = `INSERT INTO comment (text, authorId, postId, createdAt, updatedAt) VALUES ${values.join(', ')};`;
        await connection.query(sql);
        await connection.query('COMMIT;');
        
        console.log(`Seeded ${i + currentBatchSize} comments... (${((Date.now() - startCommentTime) / 1000).toFixed(1)}s)`);
    }

    const totalTime = ((Date.now() - startUserTime) / 1000 / 60).toFixed(1);
    console.log(`--- Seeding finished in ${totalTime} minutes ---`);
    await AppDataSource.destroy();
}

run().catch(console.error);
