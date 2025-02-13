import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  async getActiveSubscriptions() {
    return this.prisma.subscription.findMany({
      where: { status: 'active' },
    });
  }
}
