import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Room Management API')
    .setDescription('API for managing rental rooms')
    .setVersion(process.env.VERSION ?? '1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste access token here',
      },
      'access-token',
    )
    .addSecurityRequirements('access-token')
    // .addTag('rooms')
    .build();

  app.setGlobalPrefix(process.env.GLOBAL_PREFIX ?? 'api/v1');

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(process.env.SWAGGER_PATH ?? 'docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
