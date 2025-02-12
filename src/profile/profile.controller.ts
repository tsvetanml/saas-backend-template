import { Controller, Get, Param, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { ProfileService } from './profile.service';

@Controller('profile')
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  // Only the authenticated user can view their profile
  @Get()
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    return this.profileService.getUserProfile(req.user.id);
  }

  // Only admins can view other users profiles
  @Get(':id')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getAnyProfile(@Param('id') userId: string) {
    return this.profileService.getUserProfile(userId);
  }
}
