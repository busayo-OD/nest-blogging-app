import { Controller, Post, Body, Req, UseGuards, HttpException, HttpStatus, Param, Put, Patch, ParseIntPipe, BadRequestException, InternalServerErrorException, Get, Query, NotFoundException } from '@nestjs/common';
import { BlogService } from './blog.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateBlogDto } from './dto/create-blog.dto';
import { Blog } from './entities/blog.entity';
import { AuthenticatedRequest } from 'src/types/authenticated-request.interface';
import { UpdateBlogDto } from './dto/update-blog.dto';

@Controller('blogs')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async createArticle(
    @Body() createArticleDto: CreateBlogDto,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    const savedArticle = await this.blogService.createArticle(
      createArticleDto,
      userId,
    );
    return { statusCode: 201, data: savedArticle };
  }

  @Put(':id/state')
  @UseGuards(AuthGuard('jwt'))
  async updateArticleState(
    @Param('id') id: number,
    @Body('state') state: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ status: boolean; article: Blog }> {
    const userId = req.user._id;

    try {
      const updatedArticle = await this.blogService.updateArticleState(
        id,
        userId,
        state,
      );
      return { status: true, article: updatedArticle };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error updating article state:', error);
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  async updateArticle(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
    @Body() updates: UpdateBlogDto,
  ): Promise<Blog> {
    const userId = req.user._id;

    return await this.blogService.editArticle(id, userId, updates);
  }

  @Get()
  async getArticles(@Query() query) {
    try {
      const articles = await this.blogService.getArticles(query);
      return { status: true, articles };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof InternalServerErrorException) {
        throw new InternalServerErrorException(error.message);
      }
      throw new InternalServerErrorException('Unexpected error');
    }
  }

  @Get(':id')
  async getArticleById(@Param('id') id: number) {
    try {
      const result = await this.blogService.getArticleById(id);
      return result;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('An error occurred while fetching the article');
    }
  }
}

