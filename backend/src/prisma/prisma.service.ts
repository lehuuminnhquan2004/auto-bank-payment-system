import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(configService: ConfigService) {
    const adapter = new PrismaMariaDb({
      host: configService.getOrThrow<string>('DATABASE_HOST'),
      port: Number(configService.getOrThrow<string>('DATABASE_PORT')),
      user: configService.getOrThrow<string>('DATABASE_USER'),
      password: configService.getOrThrow<string>('DATABASE_PASSWORD'),
      database: configService.getOrThrow<string>('DATABASE_NAME'),
      connectionLimit: 5,
      allowPublicKeyRetrieval: true
    });

    super({ adapter });
  }

  async onModuleInit() {
    try{
    await this.$connect();
    await this.$queryRaw`SELECT 1`;
    console.log('Database connected');
    } catch (error) {
    console.error('Database connection failed');
    throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}