import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { HouseService } from "./houses.service";
import { HouseController } from "./houses.controller";
import { House } from "./entities/house.entity";
import { HouseStaff } from "./entities/house-staff.entity";
import { User } from "../users/entities/user.entity";

@Module({
    imports: [TypeOrmModule.forFeature([House, HouseStaff, User])],
    controllers: [HouseController],
    providers: [HouseService],
})
export class HouseModule {}