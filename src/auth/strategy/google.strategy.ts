import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from "@nestjs/config";
import { User } from '../../users/entities/user.entity';
import { Strategy, VerifyCallback } from 'passport-google-oauth2';
import { AuthService } from '../auth.service';

import { OAuthProvider } from '../../users/entities/oauth-provider.entity';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
    @InjectRepository(OAuthProvider) private oauthRepository: Repository<OAuthProvider>,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['profile', 'email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, name, emails } = profile;
  
    try {
      // Check if the OAuthProvider exists
      const oauthProvider = await this.oauthRepository.findOne({
        where: { providerId: id, provider: 'google' },
        relations: ['user'], // Include the related User entity
      });
  
      let user: User;
  
      if (!oauthProvider) {
        // If no OAuthProvider entry, check if a user exists with the email
        user = await this.userRepository.findOne({ where: { email: emails[0].value } });
  
        if (!user) {
          // If no user exists, create a new user
          user = await this.userRepository.save(
            this.userRepository.create({
              firstname: name.givenName,
              lastname: name.familyName,
              email: emails[0].value,
              password: '', // No password for OAuth users
            }),
          );
        }
  
        // Create a new OAuthProvider entry
        const newOAuthProvider = this.oauthRepository.create({
          provider: 'google',
          providerId: id,
          user,
        });
        await this.oauthRepository.save(newOAuthProvider);
      } else {
        // Use the associated user
        user = oauthProvider.user;
      }
  
      // Generate the access token for the authenticated user
      const accessToken = await this.authService.login(user);
  
      // Pass the authenticated user and access token to the callback
      done(null, { user, accessToken });
    } catch {
      done(new UnauthorizedException('Google authentication failed'), false);
    }
  }
  
}
