import { ApiProperty } from '@nestjs/swagger';
import { BlogState } from '../enums/blog-state.enum';
import { AuthorDto } from './author.dto';

export class BlogResponseDto {
  @ApiProperty()  
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  state: BlogState;

  @ApiProperty()
  readCount: number;

  @ApiProperty()
  readingTime: number;

  @ApiProperty()
  tags: string[];

  @ApiProperty()
  body: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  author: AuthorDto;

  constructor(blog: Partial<BlogResponseDto>, author: Partial<AuthorDto>) {
    this.id = blog.id;
    this.title = blog.title;
    this.description = blog.description;
    this.state = blog.state;
    this.readCount = blog.readCount;
    this.readingTime = blog.readingTime;
    this.tags = blog.tags;
    this.body = blog.body;
    this.createdAt = blog.createdAt;
    this.updatedAt = blog.updatedAt;
    this.author = new AuthorDto(author);
  }
}
