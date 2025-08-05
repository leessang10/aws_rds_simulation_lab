// src/prisma/prisma.service.ts (완전한 PrismaService)

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    // NestJS 모듈이 초기화될 때 Prisma 클라이언트를 데이터베이스에 연결
    async onModuleInit() {
        await this.$connect();
    }

    // 애플리케이션이 종료될 때 Prisma 클라이언트의 연결을 해제
    async onModuleDestroy() {
        await this.$disconnect();
    }
}