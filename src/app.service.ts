import { Injectable } from '@nestjs/common';
import { UsersService } from './users/users.service';
import { User } from './users/entities/user.entity';

@Injectable()
export class AppService {
  constructor(private usersService: UsersService) {}
  async getHello(userId: string): Promise<string> {
    const user: User = await this.usersService.findOneById(userId);
    return `Hello ${user.firstname}!`;
  }
}
