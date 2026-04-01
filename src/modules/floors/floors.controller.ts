import { Controller, Get, Post, Body, Param, Query, Put, Delete, Req } from '@nestjs/common'
import { FloorService } from './floors.service';
import { CreateFloorDto } from './dto/create-floor.dto';
import { FloorResponseDto } from './dto/response-floor.dto';
import { UpdateFloorDto } from './dto/update-floor.dto';
import { ApiQuery } from '@nestjs/swagger';
import { ListFloorQueryDto } from './dto/ListFloorQuery.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { Request } from 'express';

@Roles('admin') // Only users with 'admin' role can access these routes
@Controller('floors')
export class FloorController {
    constructor(private readonly floorService: FloorService) {}

    @Get()
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 5 })
    @ApiQuery({ name: 'search', required: false, type: String, example: '' })
    @ApiQuery({ name: 'sortBy', required: false, enum: ['floor_no', 'created_at'] })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
    findAllSummary(@Query() query: ListFloorQueryDto, @Req() req: Request & { user: JwtPayload }) {
        return this.floorService.findAllSummary(query, req.user);
    }

    @Get(':floor_id')
    @Roles('admin', 'landlord') // Both 'admin' and 'landlord' roles can access this route
    findOne(@Param('floor_id') floorId: string, @Req() req: Request & { user: JwtPayload }): Promise<{ data: FloorResponseDto[]}> {
        return this.floorService.findOne(floorId, req.user);
    }

    // @Get('house/:houseId')
    // findByHouse(@Param('houseId') houseId: string): Promise<FloorResponseDto[]> {
    //     return this.floorService.findByHouse(houseId);
    // }

    @Get('house/:house_id')
    @Roles('admin', 'landlord') // Both 'admin' and 'landlord' roles can access this route
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 5 })
    // @ApiQuery({ name: 'search', required: false, type: String, example: '' })
    @ApiQuery({ name: 'sortBy', required: false, enum: ['floor_no', 'created_at'] })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
    findByHouseSummary(@Param('house_id') houseId: string, @Query() query: ListFloorQueryDto, @Req() req: Request & { user: JwtPayload }) {
        return this.floorService.findByHouseSummary(houseId, query, req.user);
    }

    @Post()
    @Roles('admin', 'landlord') // Both 'admin' and 'landlord' roles can access this route
    create(@Body() body: CreateFloorDto, @Req() req: Request & { user: JwtPayload }): Promise<FloorResponseDto> {
        return this.floorService.create(body, req.user);
    }

    @Put(':floor_id')
    @Roles('admin', 'landlord') // Both 'admin' and 'landlord' roles can access this route
    update(@Param('floor_id') floorId: string, @Body() body: UpdateFloorDto, @Req() req: Request & { user: JwtPayload }): Promise<FloorResponseDto> {
        return this.floorService.update(floorId, body, req.user);
    }

    @Delete(':floor_id')
    @Roles('admin', 'landlord') // Both 'admin' and 'landlord' roles can access this route
    delete(@Param('floor_id') floorId: string, @Req() req: Request & { user: JwtPayload }) {
        return this.floorService.delete(floorId, req.user);
    }
}