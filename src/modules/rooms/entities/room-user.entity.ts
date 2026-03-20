import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Room } from './room.entity';
import { User } from 'src/modules/users/entities/user.entity';

@Entity('room_users')
export class RoomUser {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    room_id: string;

    @Column('uuid')
    user_id: string;

    @Column()
    start_date: Date;

    @Column()
    end_date: Date;

    @Column()
    created_at: Date;
    
    @Column()
    updated_at: Date;

    // Relations
    @ManyToOne(() => Room, (room) => room.roomUsers, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'room_id' })
    room: Room;

    @ManyToOne(() => User, (user) => user.roomUsers)
    @JoinColumn({ name: 'user_id' })
    user: User;
}