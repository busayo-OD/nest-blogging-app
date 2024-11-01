import { Controller, Post, Body, Req, UseGuards, HttpException, HttpStatus, Param, Put } from '@nestjs/common';
import { BlogService } from './blog.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateBlogDto } from './dto/create-blog.dto';
import { Blog } from './entities/blog.entity';
import { AuthenticatedRequest } from 'src/types/authenticated-request.interface';

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

  @Put(':id/state')
  async updateArticleState(
    @Param('id') id: number,
    @Body('state') state: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ status: boolean; article: Blog }> {
    const userId = req.user._id;

    try {
      const updatedArticle = await this.blogService.updateArticleState(id, userId, state);
      return { status: true, article: updatedArticle };
    } catch (error) {
      
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error updating article state:', error);
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
