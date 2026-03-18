import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { Room } from './entities/room.entity';
import { RoomUser } from './entities/room-user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Room, RoomUser])],
    controllers: [RoomController],
    providers: [RoomService],
})
export class RoomModule {}