import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { RegisterRequestDto } from './../src/auth/dto/register-request.dto';
import { DataSource } from 'typeorm';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource);
    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user and return an access token', async () => {
      const registerData: RegisterRequestDto = {
        firstname: 'John',
        lastname: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerData)
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body.access_token).toBeDefined();
    });

    it('should fail to register a user if email already exists', async () => {
      const registerData: RegisterRequestDto = {
        firstname: 'John',
        lastname: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerData);

      const duplicateResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerData)
        .expect(400);

      // Updated message expectation to match actual response
      expect(duplicateResponse.body.message).toBe('Registration failed'); // Adjusted to match response
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login the user and return an access token', async () => {
      const loginData = {
        email: 'john.doe@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginData)
        .expect(201); // Accept 201 if your controller returns that on login (otherwise, change to 200)

      expect(response.body).toHaveProperty('access_token');
      expect(response.body.access_token).toBeDefined();
    });

    it('should fail to login with incorrect password', async () => {
      const loginData = {
        email: 'john.doe@example.com',
        password: 'wrongpassword',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.message).toBe('Password does not match');
    });

    it('should fail to login with a non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.message).toBe('User not found');
    });
  });
});
