import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppLogger } from 'src/logger/logger.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { StripeService } from 'src/stripe/stripe.service';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';

@Module({
  controllers: [SubscriptionController],
  providers: [
    SubscriptionService,
    StripeService,
    PrismaService,
    JwtService,
    AppLogger,
  ],
})
export class SubscriptionModule {}
