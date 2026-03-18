import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Room } from 'src/modules/rooms/entities/room.entity';
import { BillItem } from './bill-item.entity';

@Entity('bills')
export class Bill {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    room_id: string;

    @Column()
    month: Date;

    @Column('decimal')
    total_amount: number;

    @Column()
    status: string;

    @Column()
    created_at: Date;
    
    @Column()
    updated_at: Date;

    // Relations
    @ManyToOne(() => Room, (room) => room.bills)
    @JoinColumn({ name: 'room_id' })
    room: Room;

    @OneToMany(() => BillItem, (billItem) => billItem.bill)
    billItems: BillItem[];

    @OneToMany('Payment', (payment) => 'bill')
    payments: any[];
}