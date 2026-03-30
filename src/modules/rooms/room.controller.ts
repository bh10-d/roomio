import { Controller, Get, Post, Body, Param, Query, Delete, Put, Req } from '@nestjs/common';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { ListRoomQueryDto } from './dto/ListRoomQuery.dto';
import { ApiQuery } from '@nestjs/swagger';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { Request } from 'express';

@Roles('admin') // Only users with 'admin' role can access these routes
@Controller('rooms')
export class RoomController {
    constructor(private readonly roomService: RoomService) {}

    @Get()
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 5 })
    @ApiQuery({ name: 'search', required: false, type: String, example: '' })
    @ApiQuery({ name: 'sortBy', required: false, enum: ['price', 'capacity', 'status'] })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
    findAllSummary(@Query() query: ListRoomQueryDto, @Req() req: Request & { user: JwtPayload }) {
        return this.roomService.findAllSummary(query, req.user);
    }

    @Get('floor/:floor_id')
    @Roles('admin', 'landlord') // Both 'admin' and 'landlord' roles can access this route
    findByFloor(@Param('floor_id') floor_id: string, @Req() req: Request & { user: JwtPayload }) {
        return this.roomService.findByFloor(floor_id, req.user);
    }

    @Get(':room_id')
    @Roles('admin', 'landlord', 'tenant') // 'admin', 'landlord', and 'tenant' roles can access this route
    findOne(@Param('room_id') room_id: string, @Req() req: Request & { user: JwtPayload }) {
        return this.roomService.findOne(room_id, req.user);
    }

    @Post()
    @Roles('admin', 'landlord') // Both 'admin' and 'landlord' roles can access this route
    create(@Body() body: CreateRoomDto, @Req() req: Request & { user: JwtPayload }) {
        return this.roomService.create(body, req.user);
    }

    @Put(':room_id')
    @Roles('admin', 'landlord') // Both 'admin' and 'landlord' roles can access this route
    update(@Param('room_id') roomId: string, @Body() body: UpdateRoomDto, @Req() req: Request & { user: JwtPayload }) {
        return this.roomService.update(roomId, body, req.user);
    }

    @Delete(':room_id')
    @Roles('admin', 'landlord') // Both 'admin' and 'landlord' roles can access this route
    delete(@Param('room_id') roomId: string, @Req() req: Request & { user: JwtPayload }) {
        return this.roomService.delete(roomId, req.user);
    }
}