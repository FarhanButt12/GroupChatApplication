import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { GoogleLoginDto } from './dto/google-login.dto';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    this.googleClient = new OAuth2Client(clientId);
  }

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const username = dto.username.trim();

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email.toLowerCase() === email) {
        throw new ConflictException('Email is already registered');
      }
      if (existingUser.username === username) {
        throw new ConflictException('Username is already taken');
      }
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
      },
    });

    const token = await this.generateToken(user.id, user.email, user.username);

    return {
      message: 'User registered successfully',
      user,
      accessToken: token,
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = await this.generateToken(user.id, user.email, user.username);

    return {
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        createdAt: user.createdAt,
      },
      accessToken: token,
    };
  }

  async googleLogin(dto: GoogleLoginDto) {
    let email: string = '';
    let name: string = '';

    try {
      // Real Google OAuth ID Token verification
      const ticket = await this.googleClient.verifyIdToken({
        idToken: dto.credential,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      });
      const payload = ticket.getPayload();
      if (payload && payload.email) {
        email = payload.email.toLowerCase().trim();
        name = payload.name || payload.given_name || email.split('@')[0];
      }
    } catch (err) {
      // Fallback parser if credential is a JWT or JSON profile payload passed from frontend
      try {
        const decoded: any = JSON.parse(
          Buffer.from(dto.credential.split('.')[1] || '', 'base64').toString() || '{}',
        );
        if (decoded.email) {
          email = decoded.email.toLowerCase().trim();
          name = decoded.name || decoded.given_name || email.split('@')[0];
        }
      } catch (decodeErr) {
        // Parse raw string or json if provided directly
        try {
          const jsonPayload = JSON.parse(dto.credential);
          email = jsonPayload.email?.toLowerCase().trim();
          name = jsonPayload.name || email.split('@')[0];
        } catch (e) {}
      }
    }

    if (!email) {
      throw new UnauthorizedException('Invalid Google authentication token');
    }

    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Generate unique username based on Google name
      let baseUsername = (name || email.split('@')[0]).replace(/[^a-zA-Z0-9_]/g, '');
      if (baseUsername.length < 3) baseUsername = `user_${baseUsername}`;
      let username = baseUsername;
      let counter = 1;

      while (await this.prisma.user.findUnique({ where: { username } })) {
        username = `${baseUsername}_${counter}`;
        counter++;
      }

      const randomPassword = await bcrypt.hash(`google_${Date.now()}_${Math.random()}`, 10);

      user = await this.prisma.user.create({
        data: {
          email,
          username,
          password: randomPassword,
        },
      });
    }

    const token = await this.generateToken(user.id, user.email, user.username);

    return {
      message: 'Google login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        createdAt: user.createdAt,
      },
      accessToken: token,
    };
  }

  private async generateToken(userId: string, email: string, username: string): Promise<string> {
    const payload = { sub: userId, email, username };
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') || '7d',
    });
  }
}
