import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ContractService } from './contract.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { ListContractQueryDto } from './dto/ListContractQuery.dto';
import { ApiQuery } from '@nestjs/swagger';
import { ContractResponseDto } from './dto/response-contract.dto';

@Controller('contracts')
export class ContractController {
    constructor(private readonly contractService: ContractService) {}

    // @Get()
    // findAll() {
    //     return this.contractService.findAll();
    // }

    @Get()
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 5 })
    @ApiQuery({ name: 'search', required: false, type: String, example: '' })
    @ApiQuery({ name: 'sortBy', required: false, enum: ['created_at', 'start_date', 'end_date', 'status', 'deposit_amount'] })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
    findAllSummary(@Query() query: ListContractQueryDto) {
        return this.contractService.findAllSummary(query);
    }

    @Get(':contract_id')
    findOne(@Param('contract_id') contractId: string): Promise<{data: ContractResponseDto}> {
        return this.contractService.findOne(contractId);
    }

    @Post()
    create(@Body() body: CreateContractDto) {
        return this.contractService.create(body);
    }

    @Put(':contract_id')
    update(
        @Param('contract_id') contractId: string,
        @Body() body: UpdateContractDto,
    ) {
        return this.contractService.update(contractId, body);
    }

    @Delete(':contract_id')
    delete(@Param('contract_id') contractId: string) {
        return this.contractService.delete(contractId);
    }
}