import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import * as argon2 from 'argon2';

import { Prisma } from '../generated/prisma/client.js';
import { UsersService } from '../users/users.service.js';
import { RegisterDto } from './dto/register.dto.js';

import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  //Dang ky nguoi dung
  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await argon2.hash(dto.password);

    try{
        const user = await this.usersService.create(
            email,
            passwordHash,
        );

        return {
            id: user.id.toString(),
            email: user.email,
        };
    }catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
        ) {
            throw new ConflictException('Email already exists');
        }

      throw error;
    }
    }

    //Dang nhap nguoi dung
    async login(dto: LoginDto) {
        const email = dto.email.trim().toLowerCase();

        const user = await this.usersService.findByEmail(email);

        if (!user) {
            throw new UnauthorizedException(
            'Invalid email or password',
            );
        }

        const passwordValid = await argon2.verify(
            user.passwordHash,
            dto.password,
        );

        if (!passwordValid) {
            throw new UnauthorizedException(
            'Invalid email or password',
            );
        }

        const accessToken = await this.jwtService.signAsync({
            sub: user.id.toString(),
        });

        return {
            accessToken,
        };
    }
  
}