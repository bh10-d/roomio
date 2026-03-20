import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common'
import { HouseService } from './houses.service';
import { CreateHouseDto } from './dto/create-house.dto';
import { HouseResponseDto, HouseSummaryResponseDto, HouseSummaryResponseQueryDto, HouseTreeResponseDto } from './dto/response-house.dto';
import { UpdateHouseDto } from './dto/update-house.dto';
import { ListHouseQueryDto } from './dto/ListHouseQuery.dto';
import { ApiQuery } from '@nestjs/swagger';

@Controller('houses')
export class HouseController {
    constructor(private readonly houseService: HouseService) {}

    @Get()
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 5 })
    @ApiQuery({ name: 'search', required: false, type: String, example: 'sunrise' })
    @ApiQuery({ name: 'sortBy', required: false, enum: ['name', 'address', 'created_at'] })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
    findAll(@Query() query: ListHouseQueryDto) {
        return this.houseService.findAllSummary(query);
    }

    @Get(':id')
    findOne(@Param('id')id: string): Promise<HouseResponseDto> {
        return this.houseService.findOne(id);
    }
    
    @Get('/landlord/:landlordId')
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 5 })
    @ApiQuery({ name: 'search', required: false, type: String, example: 'sunrise' })
    @ApiQuery({ name: 'sortBy', required: false, enum: ['name', 'address', 'created_at'] })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
    findByLandLordSummary(@Param('landlordId') landlordId: string, @Query() query: ListHouseQueryDto): Promise<HouseSummaryResponseQueryDto> {
        return this.houseService.findByLandLordSummary(landlordId, query);
    }

    @Get(':id/tree')
    findOneTree(@Param('id') id: string): Promise<HouseTreeResponseDto | null> {
        return this.houseService.findOneTree(id);
    }

    @Post()
    create(@Body() body: CreateHouseDto) {
        return this.houseService.create(body);
    }

    @Put(':id')
    update(@Param('id')id: string, @Body() body: UpdateHouseDto) {
        return this.houseService.update(id, body);
    }

    @Delete(':id')
    delete(@Param('id') id: string) {
        return this.houseService.delete(id);
    }
}