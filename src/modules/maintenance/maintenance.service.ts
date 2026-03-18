import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MaintenanceRequest } from './entities/maintenance-request.entity';

@Injectable()
export class MaintenanceService {
    constructor(
        @InjectRepository(MaintenanceRequest)
        private maintenanceRepository: Repository<MaintenanceRequest>,
    ) {}
}
