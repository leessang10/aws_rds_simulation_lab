import {ValidationPipe} from "@nestjs/common";
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
    // ValidationPipe를 전역으로 적용
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true, // 쿼리 파라미터를 DTO 타입으로 변환
            whitelist: true, // DTO에 정의되지 않은 속성 제거
            forbidNonWhitelisted: true, // DTO에 없는 속성이 포함되면 오류 발생
        }),
    );

  const config = new DocumentBuilder()
    .setTitle('AWS RDS Simulation Lab')
    .setDescription('API documentation for the AWS RDS Simulation Lab')
    .setVersion('1.0')
    .addTag('posts')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
