import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  RawBodyRequest,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    console.log(
      '🛠️ Stripe Secret Key:',
      stripeSecretKey ? 'Loaded ✅' : 'Not Found ❌',
    ); // 🔥 Debug
    if (!stripeSecretKey) {
      throw new Error('Stripe secret key is not defined');
    }
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-01-27.acacia',
    });
  }

  async createCheckoutSession(userId: string, plan: string) {
    const prices = {
      basic: 'price_1QrkNP03ovCgBSlffN9PTnci', // Change with your real ID in Stripe
      premium: 'price_1QrkNp03ovCgBSlf1oTMFK3n', // Change with your real ID in Stripe
    };

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: `user_${userId}@example.com`, // 👈 Ensure uniqueness
      line_items: [
        {
          price: prices[plan],
          quantity: 1,
        },
      ],
      // If you have a frontend, these URLs should point to your frontend:
      success_url: 'http://localhost:4000/stripe/success', // 'https://yourfrontend.com/payment-success',
      cancel_url: 'http://localhost:4000/stripe/cancel', // 'https://yourfrontend.com/payment-failed',
      metadata: { userId }, // 👈 Store userId in metadata for webhooks
    });

    return { url: session.url };
  }

  async handleWebhook(req: RawBodyRequest<Request>, signature: string) {
    console.log('📩 Webhook received in NestJS');

    const endpointSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );
    if (!endpointSecret) {
      throw new Error('❌ STRIPE_WEBHOOK_SECRET is not defined in .env');
    }

    let event;
    try {
      if (!req.rawBody) {
        throw new Error('Raw body is undefined');
      }
      event = this.stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        endpointSecret,
      );
    } catch (err) {
      console.error('⚠️ Webhook Error:', err.message);
      return { error: 'Webhook error' };
    }

    console.log('🔍 Event received:', event.type);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log('✅ Successful payment:', session);

      // 🔹 Extract correct subscription ID
      const subscriptionId = session.subscription; // 👈 This is the correct ID (sub_...)
      if (!subscriptionId) {
        console.error('⚠️ No subscription ID found in session.');
        return { error: 'No subscription ID in session.' };
      }

      const userId = session.metadata?.userId || '123'; // Mocked user ID
      const plan = session.metadata?.plan || 'basic';
      const status = 'active';

      try {
        // 🔥 Save the correct subscription ID in the database
        await this.prisma.subscription.create({
          data: {
            userId,
            stripeId: subscriptionId, // 👈 Now we store the real Subscription ID (sub_...)
            status,
            plan,
          },
        });

        console.log(`✅ Subscription saved in the database for user ${userId}`);
      } catch (dbError) {
        console.error('⚠️ Error saving subscription in DB:', dbError);
      }
    }

    return { received: true };
  }

  async cancelSubscription(userId: string) {
    // 🔹 Find the user's active subscription
    const subscription = await this.prisma.subscription.findFirst({
      where: { userId, status: 'active' },
    });

    if (!subscription) {
      throw new NotFoundException(
        'No active subscription found for this user.',
      );
    }

    try {
      // 🔥 Try canceling the subscription in Stripe
      const stripeResponse = await this.stripe.subscriptions.update(
        subscription.stripeId,
        {
          cancel_at_period_end: true, // 👈 This schedules the cancellation
        },
      );

      console.log('✅ Stripe Response:', stripeResponse); // 🔍 Debug Stripe response

      // 🔄 Update the database status
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'canceled' },
      });

      return {
        message:
          'Subscription will be canceled at the end of the billing cycle.',
      };
    } catch (error) {
      console.error('⚠️ Stripe API Error:', error); // 🔍 Log the full error response
      throw new ForbiddenException(
        `Failed to cancel subscription. ${error.message}`,
      );
    }
  }
}
