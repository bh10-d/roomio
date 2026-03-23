import { Controller, Get, Post, Body, Param, Query, Delete, Put } from '@nestjs/common';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { ListRoomQueryDto } from './dto/ListRoomQuery.dto';
import { ApiQuery } from '@nestjs/swagger';
import { UpdateRoomDto } from './dto/update-room.dto';

@Controller('rooms')
export class RoomController {
    constructor(private readonly roomService: RoomService) {}

    @Get()
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 5 })
    @ApiQuery({ name: 'search', required: false, type: String, example: '' })
    @ApiQuery({ name: 'sortBy', required: false, enum: ['price', 'capacity', 'status'] })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
    findAllSummary(@Query() query: ListRoomQueryDto) {
        return this.roomService.findAllSummary(query);
    }

    @Get('floor/:floor_id')
    findByFloor(@Param('floor_id') floor_id: string) {
        return this.roomService.findByFloor(floor_id);
    }

    @Get(':room_id')
    findOne(@Param('room_id') room_id: string) {
        return this.roomService.findOne(room_id);
    }

    @Post()
    create(@Body() body: CreateRoomDto) {
        return this.roomService.create(body);
    }

    @Put(':room_id')
    update(@Param('room_id') roomId: string, @Body() body: UpdateRoomDto) {
        return this.roomService.update(roomId, body);
    }

    @Delete(':room_id')
    delete(@Param('room_id') roomId: string) {
        return this.roomService.delete(roomId);
    }
}