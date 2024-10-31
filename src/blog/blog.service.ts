import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Blog } from './entities/blog.entity';
import { User } from 'src/users/entities/user.entity';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UUID } from 'crypto';

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(Blog)
    private blogRepository: Repository<Blog>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createArticle(createArticleDto: CreateBlogDto, userId: UUID): Promise<Blog> {
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

    // Optionally, update the user's articles list if needed
    user.articles = [...(user.articles || []), savedArticle];
    await this.userRepository.save(user);

    return savedArticle;
  }

  private calculateReadingTime(body: string): Record<string, any> {
    // Define logic for reading time calculation here
    return { minutes: Math.ceil(body.split(' ').length / 200) };
  }
}
