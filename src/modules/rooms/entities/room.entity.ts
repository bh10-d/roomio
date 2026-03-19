import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
// import { House } from 'src/modules/houses/entities/house.entity';
import { Bill } from 'src/modules/bills/entities/bill.entity';
import { RoomUser } from './room-user.entity';
import { Contract } from 'src/modules/contracts/entities/contract.entity';
import { MeterReading } from 'src/modules/meters/entities/meter-reading.entity';
import { MaintenanceRequest } from 'src/modules/maintenance/entities/maintenance-request.entity';
import { Floor } from 'src/modules/floors/entities/floor.entity';

@Entity('rooms')
export class Room {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    floor_id: string;

    @Column()
    name: string;

    @Column()
    price: number;

    @Column()
    capacity: number;

    @Column({ default: 'available' })
    status: string;

    // Relations
    // @ManyToOne(() => House, (house) => house.rooms)
    // @JoinColumn({ name: 'house_id' })
    // house: House;

    @ManyToOne(() => Floor, (floor) => floor.rooms)
    @JoinColumn({ name: 'floor_id' })
    floor: Floor;

    @OneToMany(() => Bill, (bill) => bill.room)
    bills: Bill[];

    @OneToMany(() => RoomUser, (roomUser) => roomUser.room)
    roomUsers: RoomUser[];

    @OneToMany(() => Contract, (contract) => contract.room)
    contracts: Contract[];

    @OneToMany(() => MeterReading, (meterReading) => meterReading.room)
    meterReadings: MeterReading[];

    @OneToMany(() => MaintenanceRequest, (maintenanceRequest) => maintenanceRequest.room)
    maintenanceRequests: MaintenanceRequest[];
}