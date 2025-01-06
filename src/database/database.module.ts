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
        const sslConfig = configService.get<string>('POSTGRES_SSL') === 'true';

        return {
          type: 'postgres',
          url: configService.get<string>('DATABASE_URL') || undefined,
          host: configService.get<string>('POSTGRES_HOST'),
          port: configService.get<number>('POSTGRES_PORT'),
          username: configService.get<string>('POSTGRES_USER'),
          password: configService.get<string>('POSTGRES_PASSWORD'),
          database: configService.get<string>('POSTGRES_DB'),
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
          synchronize: isDevelopment,
          logging: isDevelopment,
          ssl: sslConfig
            ? {
                rejectUnauthorized: true,
              }
            : false,
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
