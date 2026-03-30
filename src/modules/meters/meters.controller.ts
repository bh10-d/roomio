import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { MetersService } from './meters.service';
import { ListMeterQueryDto } from './dto/ListMeterQuery.dto';
import { MeterResponseDto } from './dto/response-meter.dto';
import { CreateMeterDto } from './dto/create-meter.dto';
import { UpdateMeterDto } from './dto/update-meter.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Roles('admin') // Only users with 'admin' role can access these routes
@Controller('meters')
export class MetersController {
    constructor(private readonly metersService: MetersService) {}

    @Get()
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    @ApiQuery({ name: 'search', required: false, type: String, example: '' })
    @ApiQuery({ name: 'sortBy', required: false, enum: ['month', 'type', 'previous_reading', 'current_reading'] })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
    findAllSummary(@Query() query: ListMeterQueryDto) {
        return this.metersService.findAllSummary(query);
    }

    @Get(':meter_id')
    @Roles('admin', 'landlord', 'tenant') // 'admin', 'landlord', and 'tenant' roles can access this route
    findOne(@Param('meter_id') meterId: string): Promise<{data: MeterResponseDto}> {
        return this.metersService.findOne(meterId);
    }

    @Post()
    @Roles('admin', 'landlord') // Both 'admin' and 'landlord' roles can access this route
    create(@Body() body: CreateMeterDto) {
        return this.metersService.create(body);
    }

    @Put(':meter_id')
    @Roles('admin', 'landlord') // Both 'admin' and 'landlord' roles can access this route
    update(@Param('meter_id') meterId: string, @Body() body: UpdateMeterDto) {
        return this.metersService.update(meterId, body);
    }

    @Delete(':meter_id')
    @Roles('admin', 'landlord') // Both 'admin' and 'landlord' roles can access this route
    delete(@Param('meter_id') meterId: string) {
        return this.metersService.delete(meterId);
    }
}
