import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Room } from 'src/modules/rooms/entities/room.entity';

@Entity('meter_readings')
export class MeterReading {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('uuid')
    room_id: string;

    @Column()
    type: string;

    @Column('decimal')
    previous_reading: number;

    @Column('decimal')
    current_reading: number;

    @Column()
    month: Date;

    // Relations
    @ManyToOne(() => Room, (room) => room.meterReadings)
    @JoinColumn({ name: 'room_id' })
    room: Room;
}
