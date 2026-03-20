import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
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

    @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    updated_at: Date;

    @Column()
    status: string;

    // Relations
    @ManyToOne(() => Bill, (bill) => bill.payments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'bill_id' })
    bill: Bill;
}
