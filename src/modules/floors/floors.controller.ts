import { Controller, Get, Post, Body, Param, Query, Put, Delete } from '@nestjs/common'
import { FloorService } from './floors.service';
import { CreateFloorDto } from './dto/create-floor.dto';
import { FloorResponseDto } from './dto/response-floor.dto';
import { UpdateFloorDto } from './dto/update-floor.dto';
import { ApiQuery } from '@nestjs/swagger';
import { ListFloorQueryDto } from './dto/ListFloorQuery.dto';

@Controller('floors')
export class FloorController {
    constructor(private readonly floorService: FloorService) {}

    @Get()
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 5 })
    @ApiQuery({ name: 'search', required: false, type: String, example: '' })
    @ApiQuery({ name: 'sortBy', required: false, enum: ['floor_no', 'created_at'] })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
    findAllSummary(@Query() query: ListFloorQueryDto) {
        return this.floorService.findAllSummary(query);
    }

    @Get(':floor_id')
    findOne(@Param('floor_id') floorId: string): Promise<{ data: FloorResponseDto[]}> {
        return this.floorService.findOne(floorId);
    }

    // @Get('house/:houseId')
    // findByHouse(@Param('houseId') houseId: string): Promise<FloorResponseDto[]> {
    //     return this.floorService.findByHouse(houseId);
    // }

    @Get('house/:house_id')
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 5 })
    // @ApiQuery({ name: 'search', required: false, type: String, example: '' })
    @ApiQuery({ name: 'sortBy', required: false, enum: ['floor_no', 'created_at'] })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
    findByHouseSummary(@Param('house_id') houseId: string, @Query() query: ListFloorQueryDto) {
        return this.floorService.findByHouseSummary(houseId, query);
    }

    @Post()
    create(@Body() body: CreateFloorDto): Promise<FloorResponseDto> {
        return this.floorService.create(body);
    }

    @Put(':floor_id')
    update(@Param('floor_id') floorId: string, @Body() body: UpdateFloorDto): Promise<FloorResponseDto> {
        return this.floorService.update(floorId, body);
    }

    @Delete(':floor_id')
    delete(@Param('floor_id') floorId: string) {
        return this.floorService.delete(floorId);
    }
}