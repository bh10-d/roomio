import { Controller, Get, Post, Body } from '@nestjs/common';
import { ContractService } from './contract.service';

@Controller('contracts')
export class ContractController {
    constructor(private readonly contractService: ContractService) {}

    @Get()
    findAll() {
        return this.contractService.findAll();
    }

    @Post()
    create(@Body() body: any) {
        return this.contractService.create(body);
    }
}