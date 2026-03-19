import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { RedisModule } from './database/redis.module';

import { DatabaseModule } from './database/database.module';
import { RoomModule } from './modules/rooms/room.module';
import { HouseModule } from './modules/houses/houses.module';
import { UserModule } from './modules/users/user.module';
import { ContractModule } from './modules/contracts/contract.module';
import { BillModule } from './modules/bills/bill.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { MaintenanceModule } from './modules/maintenance/maintenance.module';
import { MetersModule } from './modules/meters/meters.module';
import { FloorModule } from './modules/floors/floors.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    RedisModule,
    DatabaseModule,
    UserModule,
    HouseModule,
    FloorModule,
    RoomModule,
    ContractModule,
    BillModule,
    NotificationsModule,
    MaintenanceModule,
    MetersModule,
    FloorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
