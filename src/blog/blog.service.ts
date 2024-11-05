import { BadRequestException, HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Blog } from './entities/blog.entity';
import { User } from 'src/users/entities/user.entity';
import { CreateBlogDto } from './dto/create-blog.dto';

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
  ): Promise<Blog> {
    const { title, description, tags, body } = createArticleDto;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const readingTime = this.calculateReadingTime(body);

    const newArticle = this.blogRepository.create({
      title,
      description,
      tags,
      body,
      readingTime,
      author: user,
    });

    const savedArticle = await this.blogRepository.save(newArticle);

    user.articles = [...(user.articles || []), savedArticle];
    await this.userRepository.save(user);

    return savedArticle;
  }

  private calculateReadingTime(text: string): number {
    const words = text.trim().split(/\s+/).length;
    const wordsPerMinute = 200;
    return Math.ceil(words / wordsPerMinute);
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

  async updateArticleState(
    id: number,
    userId: string,
    state: string,
  ): Promise<Blog> {
    const article = await this.findOneByIdAndAuthor(id, userId);

    switch (state) {
      case 'published':
        article.state = state;
        return await this.blogRepository.save(article);

      case 'draft':
        throw new HttpException(
          'Draft state not allowed',
          HttpStatus.BAD_REQUEST,
        );

      default:
        throw new HttpException('Invalid state', HttpStatus.BAD_REQUEST);
    }
  }

  async editArticle(
    id: number,
    userId: string,
    updates: Partial<Blog>,
  ): Promise<Blog> {
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

    updateKeys.forEach((key) => {
      if (key in article && updates[key] !== undefined) {
        (article as any)[key] = updates[key];
      }
    });

    return this.blogRepository.save(article);
  }

  async getArticles(query: any) {
    const { title, tags, state, page = 1, per_page = 20 } = query;

    const findQuery: any = {};

    if (state === 'draft') {
      throw new BadRequestException(
        'You cannot read a blog post in draft state',
      );
    }
    if (state) {
      findQuery.state = state;
    }

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
      return await this.blogRepository.find({
        where: findQuery,
        skip,
        take,
      });
    } catch {
      throw new InternalServerErrorException('Error fetching articles');
    }
  }

  async getArticleById(id: number) {
    try {
      const article = await this.blogRepository.findOne({ where: { id } });

      if (!article) {
        throw new NotFoundException('Article not found');
      }

      if (article.state !== 'published') {
        throw new NotFoundException('Article is not published');
      }

      article.readCount += 1;
      await this.blogRepository.save(article);

      return { status: true, article };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error fetching the article');
    }
  }
}
