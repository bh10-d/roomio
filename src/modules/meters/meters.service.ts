import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MeterReading } from './entities/meter-reading.entity';

@Injectable()
export class MetersService {
    constructor(
        @InjectRepository(MeterReading)
        private metersRepository: Repository<MeterReading>,
    ) {}
}
