import { Controller, Get, Post, Body, Param } from '@nestjs/common'
import { FloorService } from './floors.service';
import { CreateFloorDto } from './dto/create-floor.dto';
import { FloorResponseDto } from './dto/response-floor.dto';

@Controller('floors')
export class FloorController {
    constructor(private readonly floorService: FloorService) {}

    @Get()
    findAll(): Promise<FloorResponseDto[]> {
        return this.floorService.findAll();
    }

    @Get('house/:houseId')
    findByHouse(@Param('houseId') houseId: string): Promise<FloorResponseDto[]> {
        return this.floorService.findByHouse(houseId);
    }

    @Post()
    create(@Body() body: CreateFloorDto): Promise<FloorResponseDto> {
        return this.floorService.create(body);
    }
}