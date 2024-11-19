import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Param,
  Patch,
  ParseIntPipe,
  BadRequestException,
  InternalServerErrorException,
  Get,
  Query,
  NotFoundException,
  ForbiddenException,
  Delete,
  UnauthorizedException,
} from '@nestjs/common';
import { BlogService } from './blog.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateBlogDto } from './dto/create-blog.dto';
import { AuthenticatedRequest } from 'src/types/authenticated-request.interface';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { Public } from '../auth/decorators/public.decorator';
import { UpdateBlogStateDto } from './dto/update-blog-state.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { BlogResponseDto } from './dto/blog-response.dto';
import { MyBlogResponseDto } from './dto/my-blog-response.dto';

@Controller('blogs')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @Get()
  @ApiCreatedResponse({
    type: CreateBlogDto,
    isArray: false,
  })
  @ApiBearerAuth('JWT-auth')
  async createArticle(
    @Body() createArticleDto: CreateBlogDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.userId;
    return await this.blogService.createArticle(createArticleDto, userId);
  }

  @Public()
  @Get()
  @ApiOkResponse({
    type: BlogResponseDto,
    isArray: true,
  })
  async getArticles(@Query() query) {
    try {
      return await this.blogService.getArticles(query);
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

  @UseGuards(AuthGuard('jwt'))
  @Get('my-articles')
  @Get()
  @ApiOkResponse({
    type: MyBlogResponseDto,
    isArray: true,
  })
  @ApiBearerAuth('JWT-auth')
  async getUserArticles(
    @Req() req: AuthenticatedRequest,
  ): Promise<MyBlogResponseDto[]> {
    const user = req.user;

    if (!user || !user.userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    console.log('Authenticated user ID:', user.userId);

    const articles = await this.blogService.getUserArticles(user.userId);

    return articles.length ? articles : [];
  }

  @Patch(':id/state')
  @UseGuards(AuthGuard('jwt'))
  @Get()
  @ApiOkResponse({
    type: MyBlogResponseDto,
    isArray: false,
  })
  @ApiBearerAuth('JWT-auth')
  async updateArticleState(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBlogStateDto: UpdateBlogStateDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<MyBlogResponseDto> {
    console.log('req.user:', req.user);

    const userId = req.user.userId;
    console.log('User ID:', userId);

    return await this.blogService.updateArticleState(
      id,
      userId,
      updateBlogStateDto.state,
    );
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @Get()
  @ApiOkResponse({
    type: MyBlogResponseDto,
    isArray: false,
  })
  @ApiBearerAuth('JWT-auth')
  async updateArticle(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
    @Body() updates: UpdateBlogDto,
  ): Promise<MyBlogResponseDto> {
    const userId = req.user.userId;

    const article = await this.blogService.findOneById(id);

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    if (article.author.id !== userId) {
      throw new ForbiddenException(
        'You do not have permission to edit this article',
      );
    }

    return await this.blogService.editArticle(id, userId, updates);
  }

  @Public()
  @Get(':id')
  @ApiOkResponse({
    type: BlogResponseDto,
    isArray: false,
  })
  async getArticleById(@Param('id') id: number) {
    try {
      return await this.blogService.getArticleById(id);
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
  @ApiOkResponse({
    schema: {
      example: { status: 'true' },
    },
  })
  @ApiBearerAuth('JWT-auth')
  async deleteArticleById(
    @Param('id') id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    try {
      await this.blogService.deleteArticleById(id, userId);
      return { status: 'true' };
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
}
