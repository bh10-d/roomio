import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Room } from 'src/modules/rooms/entities/room.entity';
import { House } from 'src/modules/houses/entities/house.entity';

@Entity('floors')
export class Floor {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    house_id: string;

    @Column({ default: 1 })
    floor_no: number;

    @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;
    
    @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    updated_at: Date;

    // Relations
    @OneToMany(() => Room, (room) => room.floor)
    rooms: Room[];

    @ManyToOne(() => House, (house) => house.floors, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'house_id' })
    house: House;
}