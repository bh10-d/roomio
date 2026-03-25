import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { ListNotificationQueryDto } from './dto/ListNotificationQuery.dto';
import { NotificationResponseDto } from './dto/response-notification.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification)
        private notificationsRepository: Repository<Notification>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) {}

    private buildSummaryQuery(query?: ListNotificationQueryDto) {
        const page = query?.page || 1;
        const limit = query?.limit || 10;
        const search = query?.search?.trim();
        const sortBy = query?.sortBy ?? 'created_at';
        const sortOrder = query?.sortOrder ?? 'DESC';

        const sortMap = {
            created_at: 'notification.created_at',
            type: 'notification.type',
            is_read: 'notification.is_read',
        };

        const sortColumn = sortMap[sortBy] ?? 'notification.created_at';

        const qb = this.notificationsRepository
            .createQueryBuilder('notification')
            .leftJoin('notification.user', 'user')
            .select('notification.id', 'id')
            .addSelect('notification.user_id', 'user_id')
            .addSelect('notification.title', 'title')
            .addSelect('notification.content', 'content')
            .addSelect('notification.is_read', 'is_read')
            .addSelect('notification.created_at', 'created_at')
            .addSelect('notification.type', 'type')
            .addSelect('user.id', 'user_ref_id')
            .addSelect('user.name', 'user_name')
            .addSelect('user.phone', 'user_phone')
            .addSelect('user.email', 'user_email')
            .addSelect('COUNT(*) OVER()', 'total_count');

        if (search) {
            qb.andWhere(
                '(notification.title ILIKE :search OR notification.content ILIKE :search OR notification.type ILIKE :search OR user.name ILIKE :search)',
                { search: `%${search}%` },
            );
        }

        qb.orderBy(sortColumn, sortOrder);
        qb.offset((page - 1) * limit);
        qb.limit(limit);

        return qb;
    }

    private toResponse(notification: Notification): NotificationResponseDto {
        return {
            id: notification.id,
            user_id: notification.user_id,
            title: notification.title,
            content: notification.content,
            is_read: notification.is_read,
            created_at: notification.created_at,
            type: notification.type,
            user: {
                id: notification.user.id,
                name: notification.user.name,
                phone: notification.user.phone,
                email: notification.user.email,
            },
        }
    }

    private ensureValidNotificationId(notificationId: string) {
        if (!notificationId || typeof notificationId !== 'string') {
            throw new BadRequestException('Invalid notification_id');
        }
    }

    private async ensureUserExists(userId: string) {
        const userExists = await this.userRepository.exist({ where: { id: userId } });
        if (!userExists) {
            throw new BadRequestException('Invalid user_id');
        }
    }

    async findAllSummary(query: ListNotificationQueryDto) {
        const page = query?.page || 1;
        const limit = query?.limit || 10;

        const rows = await this.buildSummaryQuery(query).getRawMany();
        const total = rows.length > 0 ? Number(rows[0].total_count) : 0;

        return {
            data: rows.map(row => ({
                id: row.id,
                user_id: row.user_id,
                title: row.title,
                content: row.content,
                is_read: row.is_read,
                created_at: row.created_at,
                type: row.type,
                user: {
                    id: row.user_ref_id,
                    name: row.user_name,
                    phone: row.user_phone,
                    email: row.user_email,
                },
            })),
            meta: {
                page,
                limit,
                total,
                totalPages: total > 0 ? Math.ceil(total / limit) : 0,
            },
        }
    }

    async findOne(notificationId: string): Promise<{data: NotificationResponseDto}> {
        this.ensureValidNotificationId(notificationId);

        const notification = await this.notificationsRepository.findOne({
            where: { id: notificationId },
            relations: ['user'],
        });

        if (!notification) {
            throw new NotFoundException('Notification not found');
        }

        return { data: this.toResponse(notification) };
    }

    async create(data: CreateNotificationDto) {
        await this.ensureUserExists(data.user_id);

        const notification = this.notificationsRepository.create({
            ...data,
            created_at: new Date(),
        });

        const notificationSaved = await this.notificationsRepository.save(notification);

        return this.findOne(notificationSaved.id);
    }

    async update(notificationId: string, data: UpdateNotificationDto) {
        this.ensureValidNotificationId(notificationId);

        const notification = await this.notificationsRepository.findOne({ where: { id: notificationId } });
        if (!notification) {
            throw new NotFoundException('Notification not found');
        }

        const nextUserId = data.user_id ?? notification.user_id;
        await this.ensureUserExists(nextUserId);

        const merged = this.notificationsRepository.merge(notification, data);
        await this.notificationsRepository.save(merged);

        return this.findOne(notificationId);
    }

    async delete(notificationId: string) {
        this.ensureValidNotificationId(notificationId);

        const result = await this.notificationsRepository.delete({ id: notificationId });
        if (result.affected === 0) {
            throw new NotFoundException('Notification not found');
        }

        return {
            message: 'Notification deleted successfully',
            notificationId,
        };
    }
}
