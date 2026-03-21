import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { House } from './house.entity';
import { User } from 'src/modules/users/entities/user.entity';

@Entity('house_staff')
export class HouseStaff {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    house_id: string;

    @Column('uuid')
    user_id: string;

    @Column()
    role: string;

    // Relations
    @ManyToOne(() => House, (house) => house.staff, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'house_id' })
    house: House;

    @ManyToOne(() => User, (user) => user.houseStaff)
    @JoinColumn({ name: 'user_id' })
    user: User;
}