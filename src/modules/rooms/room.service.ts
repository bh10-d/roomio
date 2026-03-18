import { Injectable } from "@nestjs/common";
import { InjectRepository} from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Room } from "./entities/room.entity";

@Injectable()
export class RoomService {
    constructor(
        @InjectRepository(Room)
        private roomRepository: Repository<Room>,
    ) {}

    findAll() {
        return this.roomRepository.find();
    }

    create(data: Partial<Room>) {
        const room = this.roomRepository.create(data);
        return this.roomRepository.save(room);
    }
}