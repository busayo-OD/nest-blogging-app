import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const isDevelopment = configService.get<string>('NODE_ENV') === 'development';

        return {
          type: 'postgres',
          url: configService.get<string>('DATABASE_URL') || undefined, // Use DATABASE_URL if available
          host: configService.get<string>('POSTGRES_HOST'),
          port: configService.get<number>('POSTGRES_PORT'),
          username: configService.get<string>('POSTGRES_USER'),
          password: configService.get<string>('POSTGRES_PASSWORD'),
          database: configService.get<string>('POSTGRES_DB'),
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
          synchronize: isDevelopment, // Sync schema only in development
          logging: isDevelopment,     // Enable SQL logging in development
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
