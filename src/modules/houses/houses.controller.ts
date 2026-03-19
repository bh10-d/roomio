import { Controller, Get, Post, Body, Param } from '@nestjs/common'
import { HouseService } from './houses.service';
import { CreateHouseDto } from './dto/create-house.dto';
import { HouseResponseDto, HouseSummaryResponseDto, HouseTreeResponseDto } from './dto/response-house.dto';

@Controller('houses')
export class HouseController {
    constructor(private readonly houseService: HouseService) {}

    @Get()
    findAll() {
        return this.houseService.findAllSummary();
    }
    
    @Get('/landlord/:landlordId')
    findOne(@Param('landlordId') landlordId: string): Promise<HouseSummaryResponseDto[]> {
        return this.houseService.findByLandLordSummary(landlordId);
    }

    @Get(':id/tree')
    findOneTree(@Param('id') id: string): Promise<HouseTreeResponseDto | null> {
        return this.houseService.findOneTree(id);
    }

    // @Post()
    // create(@Body() body: CreateHouseDto) {
    //     return this.houseService.create(body);
    // }
}