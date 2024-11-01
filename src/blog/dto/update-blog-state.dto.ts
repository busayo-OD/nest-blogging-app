import { IsEnum } from "class-validator";

export class UpdateBlogStateDto {
    @IsEnum(['published', 'draft'])
    state: string;
  }