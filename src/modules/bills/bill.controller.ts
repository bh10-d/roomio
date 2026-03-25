import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { BillService } from './bill.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { ListBillQueryDto } from './dto/ListBillQuery.dto';
import { BillResponseDto } from './dto/response-bill.dto';

@Controller('bills')
export class BillController {
    constructor(private readonly billService: BillService) {}

    @Get()
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    @ApiQuery({ name: 'search', required: false, type: String, example: '' })
    @ApiQuery({ name: 'sortBy', required: false, enum: ['month', 'total_amount', 'status', 'created_at'] })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
    findAllSummary(@Query() query: ListBillQueryDto) {
        return this.billService.findAllSummary(query);
    }

    @Get(':bill_id')
    findOne(@Param('bill_id') billId: string): Promise<{data: BillResponseDto}> {
        return this.billService.findOne(billId);
    }

    @Post()
    create(@Body() body: CreateBillDto) {
        return this.billService.create(body);
    }

    @Put(':bill_id')
    update(@Param('bill_id') billId: string, @Body() body: UpdateBillDto) {
        return this.billService.update(billId, body);
    }

    @Delete(':bill_id')
    delete(@Param('bill_id') billId: string) {
        return this.billService.delete(billId);
    }
}