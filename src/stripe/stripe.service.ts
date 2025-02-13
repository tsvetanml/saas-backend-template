import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  RawBodyRequest,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppLogger } from 'src/logger/logger.service';
import { PrismaService } from 'src/prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private logger: AppLogger, // ✅ Inject logger
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');

    if (!stripeSecretKey) {
      throw new Error('Stripe secret key is not defined');
    }
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-01-27.acacia',
    });
  }

  async createCheckoutSession(userId: string, plan: string) {
    this.logger.log(
      `🛒 Creating checkout session for user ${userId}, plan: ${plan}`,
    );

    const prices = {
      basic: 'price_1QrkNP03ovCgBSlffN9PTnci',
      premium: 'price_1QrkNp03ovCgBSlf1oTMFK3n',
    };

    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        customer_email: `user_${userId}@example.com`,
        line_items: [{ price: prices[plan], quantity: 1 }],
        success_url: 'http://localhost:4000/stripe/success',
        cancel_url: 'http://localhost:4000/stripe/cancel',
        metadata: { userId },
      });

      this.logger.log(`✅ Checkout session created: ${session.id}`);
      return { url: session.url };
    } catch (error) {
      this.logger.error(`❌ Error creating checkout session: ${error.message}`);
      throw new ForbiddenException('Failed to create checkout session.');
    }
  }

  async handleWebhook(req: RawBodyRequest<Request>, signature: string) {
    this.logger.log('📩 Webhook received in NestJS');

    const endpointSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );
    if (!endpointSecret) {
      throw new Error('❌ STRIPE_WEBHOOK_SECRET is not defined in .env');
    }

    let event;
    try {
      if (!req.rawBody) throw new Error('Raw body is undefined');

      event = this.stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        endpointSecret,
      );
    } catch (err) {
      this.logger.error(`⚠️ Webhook Error: ${err.message}`);
      return { error: 'Webhook error' };
    }

    this.logger.log(`🔍 Event received: ${event.type}`);

    // ✅ Handle failed payments
    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;

      if (!subscriptionId) {
        this.logger.warn('⚠️ No subscription ID found in failed invoice.');
        return { error: 'No subscription ID in invoice.' };
      }

      try {
        await this.prisma.subscription.updateMany({
          where: { stripeId: subscriptionId },
          data: { status: 'past_due' },
        });
        this.logger.warn(
          `🚨 Subscription ${subscriptionId} marked as past_due.`,
        );
      } catch (dbError) {
        this.logger.error(
          `⚠️ Error updating subscription status: ${dbError.message}`,
        );
      }
    }

    // ❌ Handle automatic subscription cancellation
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const subscriptionId = subscription.id;

      if (!subscriptionId) {
        this.logger.warn('⚠️ No subscription ID found in deletion event.');
        return { error: 'No subscription ID in event.' };
      }

      try {
        await this.prisma.subscription.updateMany({
          where: { stripeId: subscriptionId },
          data: { status: 'canceled' },
        });
        this.logger.log(
          `❌ Subscription ${subscriptionId} has been fully canceled.`,
        );
      } catch (dbError) {
        this.logger.error(
          `⚠️ Error updating subscription status to canceled: ${dbError.message}`,
        );
      }
    }

    return { received: true };
  }

  async cancelSubscription(userId: string) {
    this.logger.log(`🔄 Attempting to cancel subscription for user ${userId}`);

    const subscription = await this.prisma.subscription.findFirst({
      where: { userId, status: 'active' },
    });

    if (!subscription) {
      this.logger.warn(`⚠️ No active subscription found for user ${userId}`);
      throw new NotFoundException(
        'No active subscription found for this user.',
      );
    }

    try {
      const stripeResponse = await this.stripe.subscriptions.update(
        subscription.stripeId,
        {
          cancel_at_period_end: true,
        },
      );

      this.logger.log(
        `✅ Subscription cancellation scheduled: ${stripeResponse.id}`,
      );

      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'canceled' },
      });

      return {
        message:
          'Subscription will be canceled at the end of the billing cycle.',
      };
    } catch (error) {
      this.logger.error(`⚠️ Stripe API Error: ${error.message}`);
      throw new ForbiddenException(
        `Failed to cancel subscription. ${error.message}`,
      );
    }
  }
}
