import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
// import { Room } from 'src/modules/rooms/entities/room.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { HouseStaff } from './house-staff.entity';
import { Floor } from 'src/modules/floors/entities/floor.entity';

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

    @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    // Relations
    @ManyToOne(() => User, (user) => user.houses)
    @JoinColumn({ name: 'landlord_id' })
    landlord: User;

    // @OneToMany(() => Room, (room) => room.house)
    // rooms: Room[];

    @OneToMany(() => Floor, (floor) => floor.house)
    floors: Floor[];


    @OneToMany(() => HouseStaff, (houseStaff) => houseStaff.house)
    staff: HouseStaff[];
}