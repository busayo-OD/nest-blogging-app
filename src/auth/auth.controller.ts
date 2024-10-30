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

@Public()
@Controller('auth')
export class AuthController {

    constructor(private authService: AuthService) {}
    @UseGuards(AuthGuard('local'))
    @Post('login')
    async login(@Request() req): Promise<AuthResponseDTO | BadRequestException> {
        return this.authService.login(req.user);
    }
    @Post('register')
    async register(
        @Body() registerBody: RegisterRequestDto,
    ): Promise<AuthResponseDTO | BadRequestException> {
        return await this.authService.register(registerBody);
    }
}
