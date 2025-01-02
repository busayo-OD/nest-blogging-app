import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class OAuthProvider {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  provider: string; // e.g., 'google', 'facebook'

  @Column({ unique: true })
  providerId: string; // OAuth provider's unique ID for the user

  @ManyToOne(() => User, (user) => user.oauthProviders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;
}
