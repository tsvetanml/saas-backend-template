import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
