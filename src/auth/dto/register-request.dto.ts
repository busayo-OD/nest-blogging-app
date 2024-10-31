import { ApiProperty } from '@nestjs/swagger';

export class RegisterRequestDto {
  
  @ApiProperty()
  firstname: string;

  @ApiProperty()
  lastname: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  password: string;
}
