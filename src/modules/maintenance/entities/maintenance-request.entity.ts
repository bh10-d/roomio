import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Room } from 'src/modules/rooms/entities/room.entity';
import { User } from 'src/modules/users/entities/user.entity';

@Entity('maintenance_requests')
export class MaintenanceRequest {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('uuid')
    room_id: string;

    @Column('uuid')
    tenant_id: string;

    @Column()
    title: string;

    @Column('text')
    description: string;

    @Column()
    status: string;

    @Column()
    created_at: Date;

    @Column()
    updated_at: Date;

    // Relations
    @ManyToOne(() => Room, (room) => room.maintenanceRequests, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'room_id' })
    room: Room;

    @ManyToOne(() => User, (user) => user.maintenanceRequests)
    @JoinColumn({ name: 'tenant_id' })
    tenant: User;
}
