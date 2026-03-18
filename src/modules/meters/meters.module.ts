import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeterReading } from './entities/meter-reading.entity';
import { MetersService } from './meters.service';
import { MetersController } from './meters.controller';

@Module({
    imports: [TypeOrmModule.forFeature([MeterReading])],
    controllers: [MetersController],
    providers: [MetersService],
})
export class MetersModule {}
