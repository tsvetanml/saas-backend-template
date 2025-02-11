import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ProfileService } from './profile.service';

@Controller('profile')
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    return this.profileService.getUserProfile(req.user.id);
  }
}
