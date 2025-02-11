import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthenticatedRequest } from './auth.types';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers.authorization;

    console.log('Authorization Header:', authHeader); // 🔍 Debug

    if (!authHeader) {
      throw new UnauthorizedException('Token not provided');
    }

    const token = authHeader.split(' ')[1];

    try {
      console.log('JWT Secret in JwtAuthGuard:', process.env.JWT_SECRET); // 🔍 Debug
      const decoded = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });
      console.log('Decoded Token:', decoded); // 🔍 Debug
      request.user = decoded;
      return true;
    } catch (error) {
      console.log('JWT Error:', error); // 🔍 Debug
      throw new UnauthorizedException('Invalid token');
    }
  }
}
