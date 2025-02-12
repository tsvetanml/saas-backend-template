import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthenticatedRequest } from './auth.types';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers.authorization;

    console.log('Authorization Header:', authHeader); // 🔍 Debug

    if (!authHeader) {
      throw new UnauthorizedException('Token not provided');
    }

    const token = authHeader.split(' ')[1];

    console.log('Received Token:', token); // 🔍 Debug

    // Verify if the token has been revoked
    const isRevoked = await this.prisma.revokedToken.findUnique({
      where: { token },
    });

    if (isRevoked) {
      console.log('Token has been revoked:', token); // 🔍 Debug
      throw new UnauthorizedException('Token has been revoked');
    }

    try {
      console.log('JWT Secret in JwtAuthGuard:', process.env.JWT_SECRET); // 🔍 Debug
      const decoded = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });
      console.log('Decoded Token:', decoded); // 🔍 Debug
      request.user = decoded;
      return true;
    } catch (error) {
      console.log('JWT Verification Error:', error.message); // 🔍 Debug
      throw new UnauthorizedException('Invalid token');
    }
  }
}
