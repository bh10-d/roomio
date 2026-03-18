import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Bill } from './bill.entity';

@Entity('payments')
export class Payment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('uuid')
    bill_id: string;

    @Column('decimal')
    amount: number;

    @Column()
    payment_date: Date;

    @Column()
    method: string;

    @Column()
    created_at: Date;

    @Column()
    updated_at: Date;

    @Column()
    status: string;

    // Relations
    @ManyToOne(() => Bill, (bill) => bill.payments)
    @JoinColumn({ name: 'bill_id' })
    bill: Bill;
}
