import { Controller, Get, Post, Body } from '@nestjs/common';
import { ContractService } from './contract.service';
import { CreateContractDto } from './dto/create-contract.dto';

@Controller('contracts')
export class ContractController {
    constructor(private readonly contractService: ContractService) {}

    @Get()
    findAll() {
        return this.contractService.findAll();
    }

    @Post()
    create(@Body() body: CreateContractDto) {
        return this.contractService.create(body);
    }
}