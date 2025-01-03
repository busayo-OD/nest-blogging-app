import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, BeforeInsert } from 'typeorm';
import { Blog } from '../../blog/entities/blog.entity';
import { v4 as uuidv4 } from 'uuid';
import { OAuthProvider } from './oauth-provider.entity';


@Entity()
export class User {
  @PrimaryGeneratedColumn('increment')
  id: string;

  @Column()
  firstname: string;

  @Column()
  lastname: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @OneToMany(() => Blog, (blog) => blog.author)
  articles: Blog[];

  @OneToMany(() => OAuthProvider, (oauthProvider) => oauthProvider.user)
  oauthProviders: OAuthProvider[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    this.id = uuidv4();
  }
}

