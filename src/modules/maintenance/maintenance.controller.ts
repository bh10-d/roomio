import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { MaintenanceService } from './maintenance.service';
import { ListMaintenanceQueryDto } from './dto/ListMaintenanceQuery.dto';
import { MaintenanceResponseDto } from './dto/response-maintenance.dto';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Roles('admin') // Only users with 'admin' role can access these routes
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
    @Roles('admin', 'landlord', 'tenant') // 'admin', 'landlord', and 'tenant' roles can access this route
    findOne(@Param('maintenance_id') maintenanceId: string): Promise<{data: MaintenanceResponseDto}> {
        return this.maintenanceService.findOne(maintenanceId);
    }

    @Post()
    @Roles('admin', 'landlord') // Both 'admin' and 'landlord' roles can access this route
    create(@Body() body: CreateMaintenanceDto) {
        return this.maintenanceService.create(body);
    }

    @Put(':maintenance_id')
    @Roles('admin', 'landlord') // Both 'admin' and 'landlord' roles can access this route
    update(@Param('maintenance_id') maintenanceId: string, @Body() body: UpdateMaintenanceDto) {
        return this.maintenanceService.update(maintenanceId, body);
    }

    @Delete(':maintenance_id')
    @Roles('admin', 'landlord') // Both 'admin' and 'landlord' roles can access this route
    delete(@Param('maintenance_id') maintenanceId: string) {
        return this.maintenanceService.delete(maintenanceId);
    }
}
