import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
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

  async createArticle(createArticleDto: CreateBlogDto, userId: string): Promise<Blog> {
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


  private calculateReadingTime(text: string): { time: number; words: number } {
    const words = text.split(' ').length;
    const time = Math.ceil(words / 200);
    return { time, words };
  }

  async findOneByIdAndAuthor(id: number, authorId: string): Promise<Blog | null> {
    const article = await this.blogRepository.findOne({
      where: {
        id,
        author: { id: authorId },
      },
    });
  
    if (!article) {
      throw new HttpException('Article not found or you are not the author', HttpStatus.NOT_FOUND);
    }
    return article;
  }
  

  async updateArticleState(id: number, userId: string, state: string): Promise<Blog> {
    const article = await this.findOneByIdAndAuthor(id, userId);

    switch (state) {
      case 'published':
        article.state = state;
        return await this.blogRepository.save(article);

      case 'draft':
        throw new HttpException('Draft state not allowed', HttpStatus.BAD_REQUEST);

      default:
        throw new HttpException('Invalid state', HttpStatus.BAD_REQUEST);
    }
  }
}
