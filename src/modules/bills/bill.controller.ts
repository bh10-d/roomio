import { Controller, Get, Post, Body } from '@nestjs/common';
import { BillService } from './bill.service';
import { CreateBillDto } from './dto/create-bill.dto';

@Controller('bills')
export class BillController {
    constructor(private readonly billService: BillService) {}

    @Get()
    findAll() {
        return this.billService.findAll();
    }

    @Post()
    create(@Body() body: CreateBillDto) {
        return this.billService.create(body);
    }
}