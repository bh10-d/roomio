import { Controller, Get, Post, Body } from '@nestjs/common';
import { BillService } from './bill.service';

@Controller('bills')
export class BillController {
    constructor(private readonly billService: BillService) {}

    @Get()
    findAll() {
        return this.billService.findAll();
    }

    @Post()
    create(@Body() body: any) {
        return this.billService.create(body);
    }
}