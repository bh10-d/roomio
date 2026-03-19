import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { FloorService } from "./floors.service";
import { FloorController } from "./floors.controller";
import { Floor } from "./entities/floor.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Floor])],
    controllers: [FloorController],
    providers: [FloorService],
})
export class FloorModule {}