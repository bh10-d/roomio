import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Bill } from './bill.entity';

@Entity('bill_items')
export class BillItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    bill_id: string;

    @Column()
    type: string;

    @Column('decimal')
    amount: number;

    @Column('decimal')
    unit_price: number;

    @Column()
    quantity: number;

    @Column()
    created_at: Date;

    @Column()
    updated_at: Date;

    // Relations
    @ManyToOne(() => Bill, (bill) => bill.billItems)
    @JoinColumn({ name: 'bill_id' })
    bill: Bill;
}