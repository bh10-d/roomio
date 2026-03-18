import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository} from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { House } from "./entities/house.entity";

@Injectable()
export class HouseService {
    constructor(
        @InjectRepository(House)
        private houseRepository: Repository<House>,
    ) {}

    findAll() {
        return this.houseRepository.find({ relations: ['rooms'] });
    }

    create(data: Partial<House>) {
        const house = this.houseRepository.create(data);
        return this.houseRepository.save(house);
    }    
}