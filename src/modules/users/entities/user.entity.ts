import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Notification } from 'src/modules/notifications/entities/notification.entity';
import { HouseStaff } from 'src/modules/houses/entities/house-staff.entity';
import { RoomUser } from 'src/modules/rooms/entities/room-user.entity';
import { Contract } from 'src/modules/contracts/entities/contract.entity';
import { House } from 'src/modules/houses/entities/house.entity';
import { MaintenanceRequest } from 'src/modules/maintenance/entities/maintenance-request.entity';
import { UserSession } from 'src/modules/auth/entities/user-session.entity';
import { UserStatus } from 'src/common/enums/user-status.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  phone: string;

  @Column()
  password: string;

  @Column({ unique: true })
  email: string;

  @Column()
  role: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  last_login_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  last_seen_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  password_changed_at: Date | null;

  @Column({ type: 'int', default: 0 })
  failed_login_count: number;

  @Column({ type: 'timestamptz', nullable: true })
  locked_until: Date | null;

  @Column({ type: 'varchar', default: UserStatus.ACTIVE })
  status: UserStatus;

  // Relations
  @OneToMany(() => UserSession, (session) => session.user)
  sessions: UserSession[];

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

  @OneToMany(
    () => MaintenanceRequest,
    (maintenanceRequest) => maintenanceRequest.tenant,
  )
  maintenanceRequests: MaintenanceRequest[];
}
