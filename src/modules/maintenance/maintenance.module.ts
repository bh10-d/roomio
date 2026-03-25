import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaintenanceRequest } from './entities/maintenance-request.entity';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceController } from './maintenance.controller';
import { Room } from '../rooms/entities/room.entity';
import { User } from '../users/entities/user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([MaintenanceRequest, Room, User])],
    controllers: [MaintenanceController],
    providers: [MaintenanceService],
})
export class MaintenanceModule {}
