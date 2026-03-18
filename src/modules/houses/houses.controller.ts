import { Controller, Get, Post, Body } from '@nestjs/common'
import { HouseService } from './houses.service';

@Controller('houses')
export class HouseController {
    constructor(private readonly houseService: HouseService) {}

    @Get()
    findAll() {
        return this.houseService.findAll();
    }

    @Post()
    create(@Body() body: any) {
        return this.houseService.create(body);
    }
}