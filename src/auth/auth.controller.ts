import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Render,
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

  // Render the login page
  @Get('login')
  @Render('login') // This renders the 'views/login.hbs' file
  showLoginPage() {
    console.log('Rendering login page');
    return {}; // Pass data to the template if needed (e.g., error messages)
  }


  // Local Authentication Login API
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

  // User Registration API
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

  // Google OAuth2 Redirect API
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOkResponse({
    description: 'Redirects to Google for authentication',
  })
  async googleAuth() {
    // This endpoint is a placeholder for initiating Google OAuth2 login.
  }

  // Google OAuth2 Callback API
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOkResponse({
    type: AuthResponseDTO,
    description: 'Google OAuth2 callback endpoint',
  })
  async googleAuthRedirect(@Request() req): Promise<AuthResponseDTO> {
    const { accessToken } = req.user;
    return new AuthResponseDTO(accessToken);
  }

  // // Logout API (Optional)
  // @Post('logout')
  // @ApiOkResponse({
  //   description: 'Logs out the user',
  // })
  // async logout(@Request() req): Promise<{ message: string }> {
  //   // Optionally implement logout by invalidating the JWT
  //   return { message: 'Successfully logged out' };
  // }

  // Refresh Token API (Optional)
  // @Post('refresh')
  // @ApiOkResponse({
  //   description: 'Refreshes the access token',
  //   type: AuthResponseDTO,
  // })
  // async refreshToken(@Request() req): Promise<AuthResponseDTO> {
  //   const { refreshToken } = req.body; // Expect a refresh token in the request body
  //   try {
  //     const accessToken = await this.authService.refreshToken(refreshToken);
  //     return new AuthResponseDTO(accessToken);
  //   } catch {
  //     throw new BadRequestException('Token refresh failed');
  //   }
  // }
}




