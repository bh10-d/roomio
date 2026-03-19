import { Injectable } from "@nestjs/common";
import { InjectRepository} from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Room } from "./entities/room.entity";
import { CreateRoomDto } from "./dto/create-room.dto";

@Injectable()
export class RoomService {
    constructor(
        @InjectRepository(Room)
        private roomRepository: Repository<Room>,
    ) {}

    findAll() {
        return this.roomRepository.find();
    }

    create(data: CreateRoomDto) {
        const room = this.roomRepository.create(data);
        return this.roomRepository.save(room);
    }

    findByFloor(floorId: string) {
        return this.roomRepository.find({
            where: { floor_id: floorId },
            order: { name: 'ASC' },
        });
    }
}