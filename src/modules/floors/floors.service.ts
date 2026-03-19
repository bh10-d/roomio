import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository} from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Floor } from "./entities/floor.entity";
import { CreateFloorDto } from "./dto/create-floor.dto";
import { FloorResponseDto } from "./dto/response-floor.dto";

@Injectable()
export class FloorService {
    constructor(
        @InjectRepository(Floor)
        private floorRepository: Repository<Floor>,
    ) {}

    private toResponse(floor: Floor): FloorResponseDto {
        return {
            id: floor.id,
            house_id: floor.house_id,
            floor_no: floor.floor_no,
            // name: floor.name,
            // rooms: (floor.rooms || []).map((room) => ({
            //     id: room.id,
            //     floor_id: room.floor_id,
            //     name: room.name,
            //     price: room.price,
            //     capacity: room.capacity,
            //     status: room.status,
            // })),
        };
    }

    async findAll() {
        const floors = await this.floorRepository.find({ relations: ['rooms'], order: { floor_no: 'ASC' } });
        return floors.map(floor => this.toResponse(floor));
    }

    create(data: CreateFloorDto) {
        const floor = this.floorRepository.create(data);
        return this.floorRepository.save(floor);
    }
    
    async findByHouse(houseId: string) {
        const floors = await this.floorRepository.find({
            where: { house_id: houseId },
            // relations: [ 'rooms' ],
            order: { floor_no: 'ASC' },
        });
        return floors;
    }
}