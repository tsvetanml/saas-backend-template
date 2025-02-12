import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AppLogger } from 'src/logger/logger.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private logger: AppLogger,
  ) {}

  async register(
    email: string,
    password: string,
    role: 'USER' | 'ADMIN' = 'USER',
  ) {
    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.user.create({
      data: { email, password: hashedPassword, role },
    });
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      this.logger.warn(`Failed login attempt: ${email}`);
      throw new UnauthorizedException('User not found');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      this.logger.warn(`Failed login attempt: ${email} (wrong password)`);
      throw new UnauthorizedException('Incorrect password');
    }

    this.logger.log(`User logged in: ${email}`);

    // Generate access and refresh tokens
    const accessToken = this.jwtService.sign(
      { id: user.id, email: user.email, role: user.role },
      { expiresIn: '1h' },
    );
    const refreshToken = this.jwtService.sign(
      { id: user.id },
      { expiresIn: '7d' },
    );

    // Save the refresh token in the database
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  async refreshToken(token: string) {
    try {
      const decoded = this.jwtService.verify(token);
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user || user.refreshToken !== token) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newAccessToken = this.jwtService.sign(
        { id: user.id, email: user.email, role: user.role },
        { expiresIn: '1h' },
      );

      return { access_token: newAccessToken };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string, accessToken: string) {
    this.logger.log(`User logged out: ${userId}`);
    // Revoca el token de acceso guardándolo en la base de datos
    await this.prisma.revokedToken.create({
      data: { token: accessToken },
    });

    // Elimina el refresh token del usuario
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    return { message: 'Logged out successfully' };
  }
}
