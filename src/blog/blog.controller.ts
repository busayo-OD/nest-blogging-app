import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Param,
  Patch,
  ParseIntPipe,
  Get,
  Query,
  NotFoundException,
  ForbiddenException,
  Delete,
  UnauthorizedException,
  Inject,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { BlogService } from './blog.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateBlogDto } from './dto/create-blog.dto';
import { AuthenticatedRequest } from 'src/types/authenticated-request.interface';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { Public } from '../auth/decorators/public.decorator';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { BlogResponseDto } from './dto/blog-response.dto';
import { MyBlogResponseDto } from './dto/my-blog-response.dto';
import { CacheKey, CacheTTL, Cache } from '@nestjs/cache-manager';
import { UpdateBlogStateDto } from './dto/update-blog-state.dto';

@Controller('blogs')
export class BlogController {
  private readonly logger = new Logger(BlogController.name);

  constructor(
    private readonly blogService: BlogService,
    @Inject('CACHE_MANAGER') private readonly cacheManager: Cache,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
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
    const article = await this.blogService.createArticle(
      createArticleDto,
      userId,
    );

    // Invalidate the cache after creating the new article
    await this.cacheManager.del('all_blogs');
    this.logger.log('Cache invalidated for all_blogs after creating article');

    return article;
  }

  @Public()
  @Get()
  @CacheKey('all_blogs')
  @CacheTTL(60)
  @ApiOkResponse({
    type: BlogResponseDto,
    isArray: true,
  })
  async getArticles(@Query() query) {
    const cacheKey = 'all_blogs';

    // Check cache for articles
    const cachedArticles = await this.cacheManager.get(cacheKey);
    if (cachedArticles) {
      this.logger.log('Cache hit for all_blogs:', cachedArticles);
      return cachedArticles;
    }

    this.logger.log('Cache miss for all_blogs, fetching articles from DB');
    try {
      const articles = await this.blogService.getArticles(query);
      this.logger.log('Fetched articles from DB:', articles);

      // Cache the fetched articles (set ttl as number instead of an object)
      await this.cacheManager.set(cacheKey, articles, 60);
      this.logger.log('Articles cached:', articles);

      return articles;
    } catch (error) {
      this.logger.error('Error fetching articles:', error);
      throw new InternalServerErrorException(
        'Error fetching articles from the database',
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('my-articles')
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

    const articles = await this.blogService.getUserArticles(user.userId);

    return articles.length ? articles : [];
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
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

    const updatedArticle = await this.blogService.editArticle(
      id,
      userId,
      updates,
    );

    // Invalidate cache after updating the article
    await this.cacheManager.del('all_blogs');
    this.logger.log('Cache invalidated for all_blogs after updating article');

    return updatedArticle;
  }

  @Patch(':id/state')
  @UseGuards(AuthGuard('jwt'))
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
    const userId = req.user?.userId;

    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    this.logger.log(`User ${userId} is updating the state of article ${id}`);

    try {
      const updatedArticle = await this.blogService.updateArticleState(
        id,
        userId,
        updateBlogStateDto.state,
      );

      // Invalidate the cache for the specific article and the article list
      await this.cacheManager.del('all_blogs');
      await this.cacheManager.del(`article_${id}`);
      this.logger.log(`Cache invalidated for all_blogs and article_${id}`);

      return updatedArticle;
    } catch (error) {
      this.logger.error('Error updating article state:', error);
      if (error instanceof NotFoundException) {
        throw new NotFoundException('Article not found');
      }
      if (error instanceof ForbiddenException) {
        throw new ForbiddenException(error.message);
      }
      throw new InternalServerErrorException('Error updating article state');
    }
  }

  @Public()
  @Get(':id')
  @ApiOkResponse({
    type: BlogResponseDto,
    isArray: false,
  })
  async getArticleById(@Param('id') id: number) {
    const cacheKey = `article_${id}`;

    // Check cache for the article
    const cachedArticle = await this.cacheManager.get(cacheKey);
    if (cachedArticle) {
      this.logger.log('Cache hit for article:', cachedArticle);
      return cachedArticle;
    }

    this.logger.log('Cache miss for article, fetching from DB');
    try {
      const article = await this.blogService.getArticleById(id);
      // Cache the fetched article (set ttl as number instead of an object)
      await this.cacheManager.set(cacheKey, article, 300);
      this.logger.log('Article cached:', article);
      return article;
    } catch (error) {
      this.logger.error('Error fetching article:', error);
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

      // Invalidate cache after deleting the article
      await this.cacheManager.del('all_blogs');
      await this.cacheManager.del(`article_${id}`);
      this.logger.log('Cache invalidated for all_blogs and article_', id);

      return { status: 'true' };
    } catch (error) {
      this.logger.error('Error deleting article:', error);
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
