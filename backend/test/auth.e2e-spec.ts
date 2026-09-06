import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';

import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const email = `auth-test-${Date.now()}@example.com`;
  const password = 'Password123!';

  beforeAll(async () => {
    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix('api');

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email,
      },
    });

    await app.close();
  });

  it('/api/auth/register (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password,
      })
      .expect(201);

    expect(response.body.email).toBe(email);
    expect(response.body.id).toBeDefined();
    expect(response.body.passwordHash).toBeUndefined();

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    expect(user).not.toBeNull();
    expect(user?.passwordHash).not.toBe(password);
    expect(user?.passwordHash).toContain('$argon2');
  });

  it('/api/auth/register duplicate email (POST)', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password,
      })
      .expect(409);
  });

  it('/api/auth/register invalid email (POST)', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'invalid-email',
        password,
      })
      .expect(400);
  });

  it('/api/auth/register short password (POST)', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: `short-${Date.now()}@example.com`,
        password: '123',
      })
      .expect(400);
  });

  it('/api/auth/register unknown field (POST)', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: `unknown-${Date.now()}@example.com`,
        password,
        role: 'ADMIN',
      })
      .expect(400);
  });

  let accessToken: string;

  it('/api/auth/login (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email,
        password,
      })
      .expect(200);

    expect(response.body.accessToken).toBeDefined();

    accessToken = response.body.accessToken;
  });

  it('/api/auth/login wrong password (POST)', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email,
        password: 'WrongPassword123!',
      })
      .expect(401);
  });

  it('/api/auth/login unknown email (POST)', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'not-exist@example.com',
        password,
      })
      .expect(401);
  });

  it('/api/auth/me without token (GET)', async () => {
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .expect(401);
  });

  it('/api/auth/me invalid token (GET)', async () => {
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set(
        'Authorization',
        'Bearer invalid-token',
      )
      .expect(401);
  });

  it('/api/auth/me valid token (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set(
        'Authorization',
        `Bearer ${accessToken}`,
      )
      .expect(200);

    expect(response.body.email).toBe(email);
    expect(response.body.id).toBeDefined();
    expect(response.body.balance).toBe('0');

    expect(response.body.passwordHash).toBeUndefined();
  });
});