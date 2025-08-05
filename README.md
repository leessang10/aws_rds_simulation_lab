# AWS RDS Simulation Lab

This project is a simulation environment for testing the performance of a NestJS application with a large dataset against different AWS RDS instance specifications. It uses Docker Compose to simulate various RDS instances (`db.t3.micro` and `db.t3.xlarge`) and provides scripts to easily switch between them while sharing the same underlying data.

## Project Overview

- **API**: A NestJS application with a `posts` module that provides full CRUD functionality.
- **Database**: MySQL 8.0, managed via Docker Compose.
- **ORM**: TypeORM is used for database access and entity management.
- **Seeding**: A script is provided to populate the database with 10 million users, posts, and comments for realistic performance testing.
- **API Documentation**: Swagger UI is available at the `/api` endpoint.

---

## Getting Started

### 1. Project Setup

Install the project dependencies:

```bash
$ pnpm install
```

### 2. Database Setup

This project uses a shared Docker volume to ensure data is persistent and consistent when switching between different instance simulations. 

First, create the shared Docker volume. **This command only needs to be run once.**

```bash
$ docker volume create mysql-data
```

### 3. Running the Database Simulation

You can simulate two different AWS RDS instance types. Each runs in its own Docker container but connects to the same `mysql-data` volume created above.

**⚠️ Important:** Never run both containers at the same time, as they point to the same data directory. This can lead to data corruption. Always bring one down before bringing the other up.

**Option 1: `db.t3.micro` (Development Environment)**
- **Specs**: 2 vCPUs, 1GB Memory
- **Port**: 3306

```bash
# Start the t3.micro container
$ pnpm docker:t3-micro:up

# Stop the t3.micro container
$ pnpm docker:t3-micro:down
```

**Option 2: `db.t3.xlarge` (Production Simulation)**
- **Specs**: 4 vCPUs, 16GB Memory
- **Port**: 3307

```bash
# Start the t3.xlarge container
$ pnpm docker:t3-xlarge:up

# Stop the t3.xlarge container
$ pnpm docker:t3-xlarge:down
```

### 4. Database Migration

After starting a database container for the first time with the new volume, you need to apply the database schema. **This command only needs to be run once for the shared volume.**

```bash
# TypeORM will auto-sync the schema (synchronize: true in development)
# For production, use migrations instead
```

### 5. Database Seeding

After migrating the database, you can populate it with a large set of mock data.

```bash
# Run the seed script
$ pnpm seed
```

### 6. Running the Application

Once the database is running and seeded, you can start the NestJS application.

```bash
# Watch mode
$ pnpm run start:dev

# Production mode
$ pnpm run start:prod
```

Once the application is running, you can access the Swagger API documentation at [http://localhost:3000/api](http://localhost:3000/api).

---

## Available Scripts

- `pnpm run build`: Build the application.
- `pnpm run start:dev`: Start the application in watch mode.
- `pnpm run lint`: Lint the codebase.
- `pnpm run test`: Run unit tests.
- `pnpm run seed`: Seed the database.
- `pnpm run docker:t3-micro:up`: Start the `t3.micro` database container.
- `pnpm run docker:t3-micro:down`: Stop the `t3.micro` database container.
- `pnpm run docker:t3-xlarge:up`: Start the `t3.xlarge` database container.
- `pnpm run docker:t3-xlarge:down`: Stop the `t3.xlarge` database container.

---

## Performance Optimization

### Large Dataset Performance Issues

With 10+ million records, the Posts API may experience performance issues. Here are the optimization strategies implemented:

#### 1. Database Indexing
- **Essential Indexes**: Create proper indexes for query optimization
- **Index File**: See `database-indexes.md` for all required index creation queries
- **Key Indexes**:
  - Composite indexes: `(status, type, createdAt)`, `(authorId, createdAt)`
  - Search indexes: `title`, `createdAt`, `updatedAt`
  - Full-text search index for content search

#### 2. Query Optimization
- **N+1 Problem Solved**: Uses `leftJoinAndSelect` instead of separate queries
- **Cursor-based Pagination**: Implements efficient pagination using ID/timestamp cursors
- **Selective Loading**: Loads only required fields and relationships
- **Raw SQL**: Uses optimized raw SQL for complex queries

#### 3. API Performance Features
- **Smart Pagination**: Cursor-based pagination prevents deep offset issues
- **Search Optimization**: Full-text search for title/content, optimized LIKE queries
- **Conditional Relations**: Loads author data only when needed
- **Response Optimization**: Minimal data transfer with selective field loading

#### 4. Performance Monitoring
- **Query Logging**: Enable TypeORM logging to monitor slow queries
- **Execution Time**: Monitor API response times in different scenarios
- **Index Usage**: Verify index effectiveness with EXPLAIN queries

### Expected Performance Improvements
- **Before Optimization**: 10+ seconds for complex queries
- **After Optimization**: <100ms for most queries
- **Pagination**: Deep pagination (page 1000+) performs consistently
- **Search**: Full-text search responds in <200ms

### API Version Comparison

The Posts API is available in two versions for performance comparison:

#### V1 API (Original - `/posts`)
- **Traditional pagination**: Uses OFFSET/LIMIT (slower on large datasets)
- **Basic queries**: Standard TypeORM queries without optimization
- **N+1 queries**: Separate queries for relationships
- **Simple filtering**: Basic LIKE queries for search

#### V2 API (Optimized - `/posts/v2`)
- **Cursor pagination**: ID-based pagination (consistent performance)
- **Optimized queries**: Query builder with JOIN optimization
- **N+1 solved**: Single query with leftJoinAndSelect
- **Full-text search**: MySQL FULLTEXT indexes for content search
- **Smart counting**: Estimated counts for better performance

#### Performance Comparison Endpoints

| Feature | V1 Endpoint | V2 Endpoint | Expected Improvement |
|---------|-------------|-------------|---------------------|
| List posts | `GET /posts` | `GET /posts/v2` | 10-50x faster |
| Count posts | `GET /posts/count` | `GET /posts/v2/count` | 5-20x faster |
| Fast count | N/A | `GET /posts/v2/count/estimated` | 100x+ faster |
| Search posts | `GET /posts?title=keyword` | `GET /posts/v2/search?title=keyword` | 20-100x faster |
| Get post | `GET /posts/:id` | `GET /posts/v2/:id` | 2-5x faster |
| Get with comments | `GET /posts/:id` | `GET /posts/v2/:id/full` | 3-10x faster |

### Usage Tips
1. **Always use pagination** - Never fetch all records at once
2. **Add indexes first** - Run index creation queries before testing
3. **Compare V1 vs V2** - Test same queries on both endpoints to see performance difference
4. **Use V2 for production** - V2 endpoints are optimized for large datasets
5. **Monitor slow queries** - Check TypeORM logs for optimization opportunities
6. **Use appropriate instance** - Test with both t3.micro and t3.xlarge for comparison