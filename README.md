# AWS RDS Simulation Lab

This project is a simulation environment for testing the performance of a NestJS application with a large dataset against different AWS RDS instance specifications. It uses Docker Compose to simulate various RDS instances (`db.t3.micro` and `db.t3.xlarge`) and provides scripts to easily switch between them while sharing the same underlying data.

## Project Overview

- **API**: A NestJS application with a `posts` module that provides full CRUD functionality.
- **Database**: MySQL 8.0, managed via Docker Compose.
- **ORM**: Prisma is used for database access and migrations.
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
$ npx prisma migrate dev
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