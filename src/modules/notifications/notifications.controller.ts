import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { ListNotificationQueryDto } from './dto/ListNotificationQuery.dto';
import { NotificationResponseDto } from './dto/response-notification.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}

    @Get()
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    @ApiQuery({ name: 'search', required: false, type: String, example: '' })
    @ApiQuery({ name: 'sortBy', required: false, enum: ['created_at', 'type', 'is_read'] })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
    findAllSummary(@Query() query: ListNotificationQueryDto) {
        return this.notificationsService.findAllSummary(query);
    }

    @Get(':notification_id')
    findOne(@Param('notification_id') notificationId: string): Promise<{data: NotificationResponseDto}> {
        return this.notificationsService.findOne(notificationId);
    }

    @Post()
    create(@Body() body: CreateNotificationDto) {
        return this.notificationsService.create(body);
    }

    @Put(':notification_id')
    update(@Param('notification_id') notificationId: string, @Body() body: UpdateNotificationDto) {
        return this.notificationsService.update(notificationId, body);
    }

    @Delete(':notification_id')
    delete(@Param('notification_id') notificationId: string) {
        return this.notificationsService.delete(notificationId);
    }
}
