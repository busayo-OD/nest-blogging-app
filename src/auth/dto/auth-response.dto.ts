import { ApiProperty } from '@nestjs/swagger';
import { AccessToken } from '../types/access-token';

export class AuthResponseDTO {
  @ApiProperty()
  access_token: string;

  constructor(accessToken: AccessToken) {
    this.access_token = accessToken.access_token;
  }
}
