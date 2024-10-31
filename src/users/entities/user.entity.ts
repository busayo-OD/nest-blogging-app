import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UUID } from 'crypto';
import { Blog } from 'src/blog/entities/blog.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id?: UUID;

  @Column()
  firstname: string;

  @Column()
  lastname: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @OneToMany(() => Blog, (blog) => blog.author)
  articles: Blog[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;


}
