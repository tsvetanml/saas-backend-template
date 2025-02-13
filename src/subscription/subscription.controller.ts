import { Controller, Delete, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { StripeService } from 'src/stripe/stripe.service';
import { SubscriptionService } from './subscription.service';

@Controller('subscriptions')
export class SubscriptionController {
  constructor(
    private subscriptionService: SubscriptionService,
    private stripeService: StripeService,
  ) {}

  @Get('active')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getActiveSubscriptions() {
    return this.subscriptionService.getActiveSubscriptions();
  }

  @Delete('cancel')
  @UseGuards(JwtAuthGuard) // 🔒 Only authenticated users can cancel their subscription
  async cancelSubscription(@Req() req) {
    return this.stripeService.cancelSubscription(req.user.id);
  }
}
