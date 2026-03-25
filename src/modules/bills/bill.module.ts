import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bill } from './entities/bill.entity';
import { BillController } from './bill.controller';
import { BillService } from './bill.service';
import { BillItem } from './entities/bill-item.entity';
import { Payment } from './entities/payment.entity';
import { Room } from '../rooms/entities/room.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Bill, BillItem, Payment, Room])],
    controllers: [BillController],
    providers: [BillService],
})
export class BillModule {}