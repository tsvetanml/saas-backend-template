import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Enable raw request body
  });

  await app.listen(4000);
  console.log(`🚀 Server running on http://localhost:4000`);
}
bootstrap();
