import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { BlogService } from './blog.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateBlogDto } from './dto/create-blog.dto';

@Controller('blogs')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async createArticle(@Body() createArticleDto: CreateBlogDto, @Req() req: any) {
    const userId = req.user.id;
    const savedArticle = await this.blogService.createArticle(createArticleDto, userId);
    return { statusCode: 201, data: savedArticle };
  }
}
