import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Room } from 'src/modules/rooms/entities/room.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { HouseStaff } from './house-staff.entity';

@Entity('houses')
export class House {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    landlord_id: string;

    @Column()
    name: string;

    @Column()
    address: string;

    @Column()
    created_at: Date;

    // Relations
    @ManyToOne(() => User, (user) => user.houses)
    @JoinColumn({ name: 'landlord_id' })
    landlord: User;

    @OneToMany(() => Room, (room) => room.house)
    rooms: Room[];

    @OneToMany(() => HouseStaff, (houseStaff) => houseStaff.house)
    staff: HouseStaff[];
}