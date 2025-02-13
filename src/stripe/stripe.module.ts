import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AppLogger } from 'src/logger/logger.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';

@Module({
  imports: [ConfigModule],
  providers: [StripeService, PrismaService, JwtService, AppLogger],
  controllers: [StripeController],
})
export class StripeModule {}
