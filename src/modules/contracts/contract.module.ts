import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contract } from './entities/contract.entity';
import { ContractService } from './contract.service';
import { ContractController } from './contract.controller';
import { Room } from '../rooms/entities/room.entity';
import { User } from '../users/entities/user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Contract, Room, User])],
    controllers: [ContractController],
    providers: [ContractService],
})
export class ContractModule {}