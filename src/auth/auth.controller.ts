import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { RegisterRequestDto } from './dto/register-request.dto';
import { AuthResponseDTO } from './dto/auth-response.dto';
import { Public } from './decorators/public.decorator';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AccessToken } from './types/access-token';

@ApiTags('Auth')
@Public()
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(AuthGuard('local'))
  @Post('login')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string' },
        password: { type: 'string' },
      },
      required: ['email', 'password'],
    },
  })
  @ApiOkResponse({
    type: AuthResponseDTO,
    isArray: false,
  })
  async login(@Request() req): Promise<AuthResponseDTO | BadRequestException> {
    try {
      const accessToken: AccessToken = await this.authService.login(req.user);
      return new AuthResponseDTO(accessToken);
    } catch {
      throw new BadRequestException('Login failed');
    }
  }

  @Post('register')
  @ApiBody({
    type: RegisterRequestDto,
  })
  @ApiCreatedResponse({
    description: 'Created Successfully',
    type: AuthResponseDTO,
    isArray: false,
  })
  async register(
    @Body() registerBody: RegisterRequestDto,
  ): Promise<AuthResponseDTO | BadRequestException> {
    try {
      const accessToken: AccessToken = await this.authService.register(registerBody);
      return new AuthResponseDTO(accessToken);
    } catch {
      throw new BadRequestException('Registration failed');
    }
  }
}



