import { IsOptional, IsString, IsArray } from 'class-validator';

export class UpdateBlogDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];
}

