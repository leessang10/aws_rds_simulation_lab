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

## Important Notes

- The seeding script generates 10M records total (1K users, 10M posts, 10M comments)
- Both Docker containers share the same mysql-data volume for consistent testing
- Posts API includes advanced filtering, pagination, and search capabilities
- Entities use soft delete patterns with proper timestamp tracking