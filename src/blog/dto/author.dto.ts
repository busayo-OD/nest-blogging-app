import { ApiProperty } from "@nestjs/swagger";

export class AuthorDto {
    @ApiProperty()
    firstname: string;

    @ApiProperty()
    lastname: string;

    @ApiProperty()
    email: string;
  
    constructor(author: Partial<AuthorDto>) {
      Object.assign(this, author);
    }
  }
  