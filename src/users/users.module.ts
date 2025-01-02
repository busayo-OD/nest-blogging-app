import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { OAuthProvider } from './entities/oauth-provider.entity'; // Import the entity

@Module({
  imports: [TypeOrmModule.forFeature([User, OAuthProvider])], // Include OAuthProvider
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule], // Export TypeOrmModule for AuthModule
})
export class UsersModule {}

