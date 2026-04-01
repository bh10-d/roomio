import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { FloorService } from "./floors.service";
import { FloorController } from "./floors.controller";
import { Floor } from "./entities/floor.entity";
import { House } from "../houses/entities/house.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Floor, House])],
    controllers: [FloorController],
    providers: [FloorService],
})
export class FloorModule {}