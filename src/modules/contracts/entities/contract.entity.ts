import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Room } from 'src/modules/rooms/entities/room.entity';
import { User } from 'src/modules/users/entities/user.entity';

@Entity('contracts')
export class Contract {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('uuid')
    room_id: string;

    @Column('uuid')
    tenant_id: string;

    @Column()
    start_date: Date;

    @Column()
    end_date: Date;

    @Column()
    status: string;

    @Column('decimal')
    deposit_amount: number;

    @Column()
    created_at: Date;
    
    @Column()
    updated_at: Date;

    // Relations
    @ManyToOne(() => Room, (room) => room.contracts)
    @JoinColumn({ name: 'room_id' })
    room: Room;

    @ManyToOne(() => User, (user) => user.contracts)
    @JoinColumn({ name: 'tenant_id' })
    tenant: User;
}