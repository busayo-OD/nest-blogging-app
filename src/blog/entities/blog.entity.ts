import { User } from 'src/users/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Blog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', unique: true, nullable: false })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => User, (user) => user.articles, { nullable: false })
  author: User;

  @Column({
    type: 'enum',
    enum: ['draft', 'published'],
    default: 'draft',
    nullable: false,
  })
  state: 'draft' | 'published';

  @Column({ type: 'int', default: 0 })
  readCount: number;

  @Column({ type: 'int', nullable: false })
  readingTime: number;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @Column({ type: 'text', nullable: false })
  body: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

