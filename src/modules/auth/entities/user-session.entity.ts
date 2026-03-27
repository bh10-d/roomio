import { User } from 'src/modules/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('user_sessions')
export class UserSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('uuid')
  user_id: string;

  @Column({ type: 'text' })
  refresh_token_hash: string;

  @Column({ type: 'varchar', length: 255 })
  device_id: string;

  @Column({ type: 'text' })
  user_agent: string;

  @Column({ type: 'varchar', length: 100 })
  ip_address: string;

  @Column({ type: 'timestamptz' })
  expires_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  last_used_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  revoked_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
