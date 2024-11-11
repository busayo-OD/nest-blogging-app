import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { BlogState } from "../enums/blog-state.enum";

export class UpdateBlogStateDto {
  @ApiProperty({ enum: BlogState })
  @IsEnum(BlogState)
  state: BlogState;
}