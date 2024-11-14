import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Blog } from './entities/blog.entity';
import { User } from 'src/users/entities/user.entity';
import { CreateBlogDto } from './dto/create-blog.dto';
import { BlogState } from './enums/blog-state.enum';
import { BlogResponseDto } from './dto/blog-response.dto';
import { AuthorDto } from './dto/author.dto';
import { MyBlogResponseDto } from './dto/my-blog-response.dto';

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(Blog)
    private blogRepository: Repository<Blog>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createArticle(
    createArticleDto: CreateBlogDto,
    userId: string,
  ): Promise<MyBlogResponseDto> {
    if (!userId) {
      throw new Error('User ID is required to create an article.');
    }

    const readingTime = this.calculateReadingTime(createArticleDto.body);
    const author = await this.userRepository.findOne({ where: { id: userId } });

    if (!author) {
      throw new NotFoundException('Author not found');
    }

    const newArticle = this.blogRepository.create({
      ...createArticleDto,
      author,
      readingTime,
    });
    const savedArticle = await this.blogRepository.save(newArticle);

    return new MyBlogResponseDto(savedArticle);
  }

  async updateArticleState(
    id: number,
    userId: string,
    state: BlogState,
  ): Promise<MyBlogResponseDto> {
    const allowedStates = [BlogState.PUBLISHED];

    if (!allowedStates.includes(state)) {
      throw new BadRequestException('Invalid state');
    }

    const article = await this.blogRepository.findOne({
      where: { id, author: { id: userId } },
      relations: ['author'],
    });

    if (!article) {
      throw new NotFoundException(
        'Article not found or you are not the author',
      );
    }

    article.state = state;

    const updatedArticle = await this.blogRepository.save(article);

    return new MyBlogResponseDto(updatedArticle);
  }

  async editArticle(
    id: number,
    userId: string,
    updates: Partial<Blog>,
  ): Promise<MyBlogResponseDto> {
    const allowedUpdates = ['description', 'title', 'body', 'tags'];
    const updateKeys = Object.keys(updates);

    const isValidOperation = updateKeys.every((key) =>
      allowedUpdates.includes(key),
    );

    if (!isValidOperation) {
      throw new BadRequestException('Invalid updates!');
    }

    const article = await this.blogRepository.findOne({
      where: { id, author: { id: userId } },
      relations: ['author'],
    });

    if (!article) {
      throw new NotFoundException(
        'Article not found or you are not the author',
      );
    }

    if (updates.body) {
      article.readingTime = this.calculateReadingTime(updates.body);
    }

    Object.assign(article, updates);

    const updatedArticle = await this.blogRepository.save(article);

    return new MyBlogResponseDto(updatedArticle);
  }

  async getArticles(query: any): Promise<BlogResponseDto[]> {
    const { title, tags, state = 'published', page = 1, per_page = 20 } = query;
    const findQuery: any = {};

    if (state === 'draft') {
      throw new BadRequestException(
        'You cannot read a blog post in draft state',
      );
    }

    findQuery.state = state;

    if (title) {
      findQuery.title = title;
    }
    if (tags) {
      findQuery.tags = tags;
    }

    const pageNumber = Number(page);
    const perPageNumber = Number(per_page);

    if (isNaN(pageNumber) || pageNumber < 1) {
      throw new BadRequestException('Page must be a positive number');
    }
    if (isNaN(perPageNumber) || perPageNumber < 1) {
      throw new BadRequestException('Per_page must be a positive number');
    }

    const skip = (pageNumber - 1) * perPageNumber;
    const take = perPageNumber;

    try {
      const blogs = await this.blogRepository.find({
        where: findQuery,
        relations: ['author'],
        skip,
        take,
      });

      return blogs.map((blog) => this.mapToBlogResponseDto(blog));
    } catch {
      throw new InternalServerErrorException('Error fetching articles');
    }
  }

  async getArticleById(id: number) {
    try {
      const article = await this.blogRepository.findOne({
        where: { id },
        relations: ['author'],
      });

      if (!article) {
        throw new NotFoundException('Article not found');
      }

      if (article.state !== 'published') {
        throw new NotFoundException('Article is not published');
      }

      article.readCount += 1;
      await this.blogRepository.save(article);
      return this.mapToBlogResponseDto(article);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error fetching the article');
    }
  }

  async deleteArticleById(id: number, userId: string): Promise<boolean> {
    const article = await this.blogRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    if (article.author.id !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this article',
      );
    }

    await this.blogRepository.delete({ id });
    return true;
  }

  async getUserArticles(userId: string): Promise<MyBlogResponseDto[]> {
    try {
      const articles = await this.blogRepository.find({
        where: {
          author: { id: userId },
        },
        relations: ['author'],
      });

      return articles.map((article) => new MyBlogResponseDto(article));
    } catch (error) {
      console.error('Error fetching user articles:', error);
      throw new InternalServerErrorException('Error fetching user articles');
    }
  }

  private calculateReadingTime(text: string): number {
    const words = text.trim().split(/\s+/).length;
    const wordsPerMinute = 200;
    return Math.ceil(words / wordsPerMinute);
  }

  async findArticleWithAuthor(id: number): Promise<MyBlogResponseDto | null> {
    const article = await this.blogRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!article) {
      throw new HttpException('Article not found', HttpStatus.NOT_FOUND);
    }

    const blogResponseDto = new MyBlogResponseDto(article);

    return blogResponseDto;
  }

  private mapToBlogResponseDto(blog: Blog): BlogResponseDto {
    const authorDto = new AuthorDto({
      firstname: blog.author.firstname,
      lastname: blog.author.lastname,
      email: blog.author.email,
    });

    return new BlogResponseDto(blog, authorDto);
  }

  async findOneById(id: number): Promise<Blog | null> {
    return await this.blogRepository.findOne({
      where: { id },
      relations: ['author'],
    });
  }

  async findOneByIdAndAuthor(
    id: number,
    authorId: string,
  ): Promise<Blog | null> {
    const article = await this.blogRepository.findOne({
      where: {
        id,
        author: { id: authorId },
      },
    });

    if (!article) {
      throw new HttpException(
        'Article not found or you are not the author',
        HttpStatus.NOT_FOUND,
      );
    }
    return article;
  }
}
