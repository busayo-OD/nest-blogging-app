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
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Public()
@Controller('auth')
export class AuthController {

    constructor(private authService: AuthService) {}

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
    @ApiResponse({ status: 200, description: 'OK'})
    @UseGuards(AuthGuard('local'))
    @Post('login')
    async login(@Request() req): Promise<AuthResponseDTO | BadRequestException> {
        return this.authService.login(req.user);
    }

    @ApiBody({
        type: RegisterRequestDto,
     })
    @ApiResponse({ status: 201, description: 'CREATED'})
    @Post('register')
    async register(
        @Body() registerBody: RegisterRequestDto,
    ): Promise<AuthResponseDTO | BadRequestException> {
        return await this.authService.register(registerBody);
    }
}
