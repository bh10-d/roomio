import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';

@Controller('rooms')
export class RoomController {
    constructor(private readonly roomService: RoomService) {}

    @Get()
    findAll() {
        return this.roomService.findAll();
    }

    @Get('floor/:floorId')
    findByFloor(@Param('floorId') floorId: string) {
        return this.roomService.findByFloor(floorId);
    }

    @Post()
    create(@Body() body: CreateRoomDto) {
        return this.roomService.create(body);
    }
}