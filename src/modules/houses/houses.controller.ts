import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common'
import { HouseService } from './houses.service';
import { CreateHouseDto } from './dto/create-house.dto';
import { HouseResponseDto, HouseSummaryResponseDto, HouseSummaryResponseQueryDto, HouseTreeResponseDto } from './dto/response-house.dto';
import { UpdateHouseDto } from './dto/update-house.dto';
import { ListHouseQueryDto } from './dto/ListHouseQuery.dto';
import { ApiQuery } from '@nestjs/swagger';
import { CreateHouseStaffDto } from './dto/create-house-staff.dto';
import { UpdateHouseStaffDto } from './dto/update-house-staff.dto';

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

    @Get(':house_id')
    findOne(@Param('house_id') id: string): Promise<HouseResponseDto> {
        return this.houseService.findOne(id);
    }
    
    @Get('/landlord/:landlord_id')
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 5 })
    @ApiQuery({ name: 'search', required: false, type: String, example: 'sunrise' })
    @ApiQuery({ name: 'sortBy', required: false, enum: ['name', 'address', 'created_at'] })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
    findByLandLordSummary(@Param('landlord_id') landlordId: string, @Query() query: ListHouseQueryDto): Promise<HouseSummaryResponseQueryDto> {
        return this.houseService.findByLandLordSummary(landlordId, query);
    }

    @Get(':house_id/tree')
    findOneTree(@Param('house_id') id: string): Promise<HouseTreeResponseDto | null> {
        return this.houseService.findOneTree(id);
    }

    @Post()
    create(@Body() body: CreateHouseDto) {
        return this.houseService.create(body);
    }

    @Put(':house_id')
    update(@Param('house_id') id: string, @Body() body: UpdateHouseDto) {
        return this.houseService.update(id, body);
    }

    @Delete(':house_id')
    delete(@Param('house_id') id: string) {
        return this.houseService.delete(id);
    }

    // GET /houses/:house_id/staff
    @Get(':house_id/staff')
    getHouseStaff(@Param('house_id') houseId: string) {
        return this.houseService.getHouseStaff(houseId);
    }

    // POST /houses/:house_id/staff
    @Post(':house_id/staff')
    addStaff(
        @Param('house_id') houseId: string,
        @Body() body: CreateHouseStaffDto,
    ) {
        return this.houseService.addStaffToHouse(houseId, body);
    }

    // PUT /houses/:house_id/staff/:staff_id
    @Put(':house_id/staff/:staff_id')
    updateStaff(
        @Param('house_id') houseId: string,
        @Param('staff_id') staffId: string,
        @Body() body: UpdateHouseStaffDto,
    ) {
        return this.houseService.updateHouseStaff(houseId, staffId, body);
    }

    // DELETE /houses/:house_id/staff/:staff_id
    @Delete(':house_id/staff/:staff_id')
    removeStaff(
        @Param('house_id') houseId: string,
        @Param('staff_id') staffId: string,
    ) {
        return this.houseService.removeStaffFromHouse(houseId, staffId);
    }
}