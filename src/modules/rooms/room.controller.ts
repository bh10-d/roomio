import { Controller, Get, Post, Body } from '@nestjs/common';
import { RoomService } from './room.service';

@Controller('rooms')
export class RoomController {
    constructor(private readonly roomService: RoomService) {}

    @Get()
    findAll() {
        return this.roomService.findAll();
    }

    @Post()
    create(@Body() body: any) {
        return this.roomService.create(body);
    }
}