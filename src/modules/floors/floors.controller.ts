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

    @Get(':floorId')
    findOne(@Param('floorId') floorId: string): Promise<FloorResponseDto> {
        return this.floorService.findOne(floorId);
    }

    // @Get('house/:houseId')
    // findByHouse(@Param('houseId') houseId: string): Promise<FloorResponseDto[]> {
    //     return this.floorService.findByHouse(houseId);
    // }

    @Get('house/:houseId')
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 5 })
    // @ApiQuery({ name: 'search', required: false, type: String, example: '' })
    @ApiQuery({ name: 'sortBy', required: false, enum: ['floor_no', 'created_at'] })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
    findByHouseSummary(@Param('houseId') houseId: string, @Query() query: ListFloorQueryDto) {
        return this.floorService.findByHouseSummary(houseId, query);
    }

    @Post()
    create(@Body() body: CreateFloorDto): Promise<FloorResponseDto> {
        return this.floorService.create(body);
    }

    @Put(':floorId')
    update(@Param('floorId') floorId: string, @Body() body: UpdateFloorDto): Promise<FloorResponseDto> {
        return this.floorService.update(floorId, body);
    }

    @Delete(':floorId')
    delete(@Param('floorId') floorId: string) {
        return this.floorService.delete(floorId);
    }
}