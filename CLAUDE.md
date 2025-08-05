# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AWS RDS performance simulation lab built with NestJS and TypeORM. The project simulates different RDS instance specifications (t3.micro vs t3.xlarge) using Docker containers with resource limits to test performance against large datasets (10M+ records).

## Essential Commands

### Database Management
- **Create shared volume (one-time setup)**: `docker volume create mysql-data`
- **Start t3.micro simulation**: `pnpm docker:t3-micro:up` (2 vCPUs, 1GB memory, port 3306)
- **Start t3.xlarge simulation**: `pnpm docker:t3-xlarge:up` (4 vCPUs, 16GB memory, port 3306)
- **Stop containers**: `pnpm docker:t3-micro:down` or `pnpm docker:t3-xlarge:down`
- **Database seeding**: `pnpm seed` (generates 10M users, posts, and comments)

### Development
- **Development server**: `pnpm start:dev`
- **Build**: `pnpm build`
- **Production**: `pnpm start:prod`
- **Linting**: `pnpm lint`
- **Testing**: `pnpm test`, `pnpm test:watch`, `pnpm test:e2e`

## Architecture

### Database Layer
- **ORM**: TypeORM with MySQL 8.0
- **Entities**: User, Post, Comment with proper relationships and soft deletes
- **Seeding**: Batch insertion strategy with 100K records per batch for performance
- **Shared Volume**: `mysql-data` volume ensures data persistence across container switches

### API Layer
- **Framework**: NestJS with Swagger documentation at `/api`
- **Module Structure**: Posts module with full CRUD operations
- **DTOs**: Validation using class-validator and class-transformer
- **Services**: Repository pattern with TypeORM integration

### Performance Testing Setup
- **Critical Constraint**: Never run both database containers simultaneously (data corruption risk)
- **Port Configuration**: Both containers use port 3306 (must stop one before starting the other)
- **Resource Limits**: Docker resource constraints simulate actual RDS instance specifications
- **Large Dataset**: Seeding script creates realistic test data for performance analysis

### Environment Configuration
- Database connection configured via environment variables with fallback defaults
- Default credentials: root/123123123, database: test
- Synchronize enabled (not recommended for production)

## Performance Optimization

### Large Dataset Challenges
- **Dataset Size**: 10M+ records per table requires careful query optimization
- **Performance Bottlenecks**: Without proper indexing, queries can take 10+ seconds
- **Memory Usage**: Large result sets can cause memory issues

### Optimization Commands
- **Index Creation**: `mysql -h localhost -u root -p123123123 < database-indexes.sql`
- **Query Analysis**: Enable `logging: true` in TypeORM config to monitor slow queries
- **Performance Testing**: Compare response times between t3.micro vs t3.xlarge instances

### Optimization Features Implemented
- **Database Indexing**: Comprehensive indexes for filtering, sorting, and searching
- **Cursor Pagination**: Efficient pagination using ID-based cursors instead of OFFSET
- **N+1 Query Resolution**: Uses `leftJoinAndSelect` to prevent multiple queries
- **Selective Loading**: Conditional relationship loading based on requirements
- **Full-Text Search**: MySQL FULLTEXT indexes for content search optimization

### Performance Monitoring
- **TypeORM Logging**: Monitor query execution times and patterns
- **Index Usage**: Use `EXPLAIN` queries to verify index effectiveness
- **Response Times**: Target <100ms for paginated queries, <200ms for searches

### Critical Performance Rules
1. **Always Use Indexes**: Create indexes before testing large dataset queries
2. **Limit Result Sets**: Never fetch all records without pagination
3. **Monitor Query Plans**: Use EXPLAIN to verify query optimization
4. **Test Both Instances**: Compare performance on t3.micro vs t3.xlarge
5. **Use Cursor Pagination**: Avoid deep OFFSET queries (page 1000+)

## Important Notes

- The seeding script generates 10M records total (10K users, 10M posts, 10M comments)
- Both Docker containers share the same mysql-data volume for consistent testing
- Posts API includes optimized filtering, cursor pagination, and full-text search
- Entities use soft delete patterns with proper timestamp tracking
- Database indexes are essential for acceptable performance with large datasets