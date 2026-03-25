import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { MaintenanceService } from './maintenance.service';
import { ListMaintenanceQueryDto } from './dto/ListMaintenanceQuery.dto';
import { MaintenanceResponseDto } from './dto/response-maintenance.dto';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';

@Controller('maintenance')
export class MaintenanceController {
    constructor(private readonly maintenanceService: MaintenanceService) {}

    @Get()
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    @ApiQuery({ name: 'search', required: false, type: String, example: '' })
    @ApiQuery({ name: 'sortBy', required: false, enum: ['created_at', 'updated_at', 'status', 'title'] })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
    findAllSummary(@Query() query: ListMaintenanceQueryDto) {
        return this.maintenanceService.findAllSummary(query);
    }

    @Get(':maintenance_id')
    findOne(@Param('maintenance_id') maintenanceId: string): Promise<{data: MaintenanceResponseDto}> {
        return this.maintenanceService.findOne(maintenanceId);
    }

    @Post()
    create(@Body() body: CreateMaintenanceDto) {
        return this.maintenanceService.create(body);
    }

    @Put(':maintenance_id')
    update(@Param('maintenance_id') maintenanceId: string, @Body() body: UpdateMaintenanceDto) {
        return this.maintenanceService.update(maintenanceId, body);
    }

    @Delete(':maintenance_id')
    delete(@Param('maintenance_id') maintenanceId: string) {
        return this.maintenanceService.delete(maintenanceId);
    }
}
