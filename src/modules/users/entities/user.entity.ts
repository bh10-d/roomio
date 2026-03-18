import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Notification } from "src/modules/notifications/entities/notification.entity";
import { HouseStaff } from "src/modules/houses/entities/house-staff.entity";
import { RoomUser } from "src/modules/rooms/entities/room-user.entity";
import { Contract } from "src/modules/contracts/entities/contract.entity";
import { House } from "src/modules/houses/entities/house.entity";
import { MaintenanceRequest } from "src/modules/maintenance/entities/maintenance-request.entity";

@Entity("users")
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    name:string;

    @Column()
    phone: string;

    @Column({ unique: true })
    email: string;

    @Column()
    role: string;

    @Column()
    password: string;

    @Column()
    created_at: Date;

    // Relations
    @OneToMany(() => Notification, (notification) => notification.user)
    notifications: Notification[];

    @OneToMany(() => HouseStaff, (houseStaff) => houseStaff.user)
    houseStaff: HouseStaff[];

    @OneToMany(() => RoomUser, (roomUser) => roomUser.user)
    roomUsers: RoomUser[];

    @OneToMany(() => Contract, (contract) => contract.tenant)
    contracts: Contract[];

    @OneToMany(() => House, (house) => house.landlord)
    houses: House[];

    @OneToMany(() => MaintenanceRequest, (maintenanceRequest) => maintenanceRequest.tenant)
    maintenanceRequests: MaintenanceRequest[];
}