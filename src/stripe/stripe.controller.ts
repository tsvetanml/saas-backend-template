import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { StripeService } from './stripe.service';

@Controller('stripe')
export class StripeController {
  constructor(private stripeService: StripeService) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard) // 🔒 Only authenticated users can access this
  async createCheckout(@Req() req, @Body() body: { plan: string }) {
    console.log('req.user.id:', req.user.id); // 🔥 Debug
    return this.stripeService.createCheckoutSession(req.user.id, body.plan);
  }

  @Post('webhook')
  async handleWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.stripeService.handleWebhook(req, signature);
  }

  @Get('success')
  success(@Res() res: Response) {
    console.log('✅ Payment successful! You can now use your subscription.');
  }

  @Get('cancel')
  cancel(@Res() res: Response) {
    console.log('❌ Payment cancelled! You can try again.');
  }
}
