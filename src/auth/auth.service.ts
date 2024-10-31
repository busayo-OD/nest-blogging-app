import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { AccessToken } from './types/access-token';
import { RegisterRequestDto } from './dto/register-request.dto';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
      ) {}
      async validateUser(email: string, password: string): Promise<User> {
        const user: User = await this.usersService.findOneByEmail(email);
        if (!user) {
          throw new BadRequestException('User not found');
        }
        const isMatch: boolean = bcrypt.compareSync(password, user.password);
        if (!isMatch) {
          throw new BadRequestException('Password does not match');
        }
        return user;
      }

      async login(user: User): Promise<AccessToken> {
        const payload = { email: user.email, id: user.id };
        return { access_token: this.jwtService.sign(payload) };
      }

      async register(user: RegisterRequestDto): Promise<AccessToken> {
        const existingUser = await this.usersService.findOneByEmail(user.email);
        if (existingUser) {
          throw new BadRequestException('Email already exists');
        }
    
        const hashedPassword = await bcrypt.hash(user.password, 10);
    
        const newUser = await this.usersService.createUser({
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          password: hashedPassword,
        });
    
        return this.login(newUser);
      }
    
}
