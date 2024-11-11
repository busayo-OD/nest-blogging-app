import { Controller, Post, Body, Req, UseGuards, HttpException, HttpStatus, Param, Patch, ParseIntPipe, BadRequestException, InternalServerErrorException, Get, Query, NotFoundException, ForbiddenException, Delete } from '@nestjs/common';
import { BlogService } from './blog.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateBlogDto } from './dto/create-blog.dto';
import { Blog } from './entities/blog.entity';
import { AuthenticatedRequest } from 'src/types/authenticated-request.interface';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { CurrentUser } from '@app/auth/decorators/current-user.decorator';
import { Public } from '@app/auth/decorators/public.decorator';
import { UpdateBlogStateDto } from './dto/update-blog-state.dto';

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

  @Patch(':id/state')
  @UseGuards(AuthGuard('jwt'))
  async updateArticleState(
    @Param('id') id: number,
    @Body() updateBlogStateDto: UpdateBlogStateDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ status: boolean; article: Blog }> {
    const userId = req.user._id;

    try {
      const updatedArticle = await this.blogService.updateArticleState(
        id,
        userId,
        updateBlogStateDto.state,
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

    const result = await this.blogService.getArticleById(id);
    const article = result.article;

    if (article?.author?.id !== userId) {
      throw new ForbiddenException(
        'You do not have permission to edit this article',
      );
    }

    return await this.blogService.editArticle(id, userId, updates);
  }

  @Public()
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

  @Public()
  @Get(':id')
  async getArticleById(@Param('id') id: number) {
    try {
      const result = await this.blogService.getArticleById(id);
      return result;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(
        'An error occurred while fetching the article',
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async deleteArticleById(@Param('id') id: number, @Req() req) {
    const userId = req.user.id;

    try {
      const article = await this.blogService.deleteArticleById(id, userId);

      return {
        status: true,
        message: 'Article deleted successfully',
        article,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof ForbiddenException) {
        throw new ForbiddenException(error.message);
      }
      throw error;
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('my-articles')
  async getUserArticles(@CurrentUser() user: any) {
    const userId = user.id;

    const articles = await this.blogService.getUserArticles(userId);

    return {
      status: true,
      message: 'Articles fetched successfully',
      articles,
    };
  }
}

