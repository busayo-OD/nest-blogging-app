import { BadRequestException, ForbiddenException, HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
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

  async createArticle(createArticleDto: CreateBlogDto, userId: string) {
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
  
    return await this.blogRepository.save(newArticle);
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
  
    // Check for valid updates
    const isValidOperation = updateKeys.every((key) =>
      allowedUpdates.includes(key),
    );
    
    if (!isValidOperation) {
      throw new BadRequestException('Invalid updates!');
    }
  
    // Find the article with the given ID and author
    const article = await this.blogRepository.findOne({
      where: { id, author: { id: userId } }, // Ensure we check the author as well
      relations: ['author'],
    });
  
    if (!article) {
      throw new NotFoundException('Article not found or you are not the author');
    }
  
    if (updates.body) {
      const newReadingTime = this.calculateReadingTime(updates.body);
      article.readingTime = newReadingTime;
    }
  
    Object.assign(article, updates);
    
    return await this.blogRepository.save(article);
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

  async deleteArticleById(id: number, userId: string) {
    
    const article = await this.blogRepository.findOne({ where: { id } });
  
    if (!article) {
      throw new NotFoundException('Article not found');
    }
  
    if (article.author.toString() !== userId) {
      throw new ForbiddenException('You do not have permission to delete this article');
    }
  
    await this.blogRepository.delete({ id });
  
    return article;
  } 
  
  async getUserArticles(userId: string) {
    return await this.blogRepository.find({ where: { author: { id: userId } } });
  }

}
