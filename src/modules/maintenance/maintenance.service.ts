import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MaintenanceRequest } from './entities/maintenance-request.entity';
import { ListMaintenanceQueryDto } from './dto/ListMaintenanceQuery.dto';
import { MaintenanceResponseDto } from './dto/response-maintenance.dto';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { Room } from 'src/modules/rooms/entities/room.entity';
import { User } from 'src/modules/users/entities/user.entity';

@Injectable()
export class MaintenanceService {
    constructor(
        @InjectRepository(MaintenanceRequest)
        private maintenanceRepository: Repository<MaintenanceRequest>,
        @InjectRepository(Room)
        private roomRepository: Repository<Room>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) {}

    private buildSummaryQuery(query?: ListMaintenanceQueryDto) {
        const page = query?.page || 1;
        const limit = query?.limit || 10;
        const search = query?.search?.trim();
        const sortBy = query?.sortBy ?? 'created_at';
        const sortOrder = query?.sortOrder ?? 'DESC';

        const sortMap = {
            created_at: 'maintenance.created_at',
            updated_at: 'maintenance.updated_at',
            status: 'maintenance.status',
            title: 'maintenance.title',
        };

        const sortColumn = sortMap[sortBy] ?? 'maintenance.created_at';

        const qb = this.maintenanceRepository
            .createQueryBuilder('maintenance')
            .leftJoin('maintenance.room', 'room')
            .leftJoin('maintenance.tenant', 'tenant')
            .select('maintenance.id', 'id')
            .addSelect('maintenance.room_id', 'room_id')
            .addSelect('maintenance.tenant_id', 'tenant_id')
            .addSelect('maintenance.title', 'title')
            .addSelect('maintenance.description', 'description')
            .addSelect('maintenance.status', 'status')
            .addSelect('maintenance.created_at', 'created_at')
            .addSelect('maintenance.updated_at', 'updated_at')
            .addSelect('room.id', 'room_ref_id')
            .addSelect('room.floor_id', 'room_floor_id')
            .addSelect('room.name', 'room_name')
            .addSelect('tenant.id', 'tenant_ref_id')
            .addSelect('tenant.name', 'tenant_name')
            .addSelect('tenant.phone', 'tenant_phone')
            .addSelect('tenant.email', 'tenant_email')
            .addSelect('COUNT(*) OVER()', 'total_count');

        if (search) {
            qb.andWhere(
                '(maintenance.title ILIKE :search OR maintenance.description ILIKE :search OR maintenance.status ILIKE :search OR room.name ILIKE :search OR tenant.name ILIKE :search)',
                { search: `%${search}%` },
            );
        }

        qb.orderBy(sortColumn, sortOrder);
        qb.offset((page - 1) * limit);
        qb.limit(limit);

        return qb;
    }

    private toResponse(maintenance: MaintenanceRequest): MaintenanceResponseDto {
        return {
            id: maintenance.id,
            room_id: maintenance.room_id,
            tenant_id: maintenance.tenant_id,
            title: maintenance.title,
            description: maintenance.description,
            status: maintenance.status,
            created_at: maintenance.created_at,
            updated_at: maintenance.updated_at,
            room: {
                id: maintenance.room.id,
                floor_id: maintenance.room.floor_id,
                name: maintenance.room.name,
            },
            tenant: {
                id: maintenance.tenant.id,
                name: maintenance.tenant.name,
                phone: maintenance.tenant.phone,
                email: maintenance.tenant.email,
            },
        }
    }

    private ensureValidMaintenanceId(maintenanceId: string) {
        if (!maintenanceId || typeof maintenanceId !== 'string') {
            throw new BadRequestException('Invalid maintenance_id');
        }
    }

    private async ensureRoomAndTenantExist(roomId: string, tenantId: string) {
        const [roomExists, tenantExists] = await Promise.all([
            this.roomRepository.exist({ where: { id: roomId } }),
            this.userRepository.exist({ where: { id: tenantId } }),
        ]);

        if (!roomExists) {
            throw new BadRequestException('Invalid room_id');
        }

        if (!tenantExists) {
            throw new BadRequestException('Invalid tenant_id');
        }
    }

    async findAllSummary(query: ListMaintenanceQueryDto) {
        const page = query?.page || 1;
        const limit = query?.limit || 10;

        const rows = await this.buildSummaryQuery(query).getRawMany();
        const total = rows.length > 0 ? Number(rows[0].total_count) : 0;

        return {
            data: rows.map(row => ({
                id: row.id,
                room_id: row.room_id,
                tenant_id: row.tenant_id,
                title: row.title,
                description: row.description,
                status: row.status,
                created_at: row.created_at,
                updated_at: row.updated_at,
                room: {
                    id: row.room_ref_id,
                    floor_id: row.room_floor_id,
                    name: row.room_name,
                },
                tenant: {
                    id: row.tenant_ref_id,
                    name: row.tenant_name,
                    phone: row.tenant_phone,
                    email: row.tenant_email,
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

    async findOne(maintenanceId: string): Promise<{data: MaintenanceResponseDto}> {
        this.ensureValidMaintenanceId(maintenanceId);

        const maintenance = await this.maintenanceRepository.findOne({
            where: { id: maintenanceId },
            relations: ['room', 'tenant'],
        });

        if (!maintenance) {
            throw new NotFoundException('Maintenance request not found');
        }

        return { data: this.toResponse(maintenance) };
    }

    async create(data: CreateMaintenanceDto) {
        await this.ensureRoomAndTenantExist(data.room_id, data.tenant_id);

        const now = new Date();
        const maintenance = this.maintenanceRepository.create({
            ...data,
            created_at: now,
            updated_at: now,
        });

        const maintenanceSaved = await this.maintenanceRepository.save(maintenance);

        return this.findOne(maintenanceSaved.id);
    }

    async update(maintenanceId: string, data: UpdateMaintenanceDto) {
        this.ensureValidMaintenanceId(maintenanceId);

        const maintenance = await this.maintenanceRepository.findOne({ where: { id: maintenanceId } });
        if (!maintenance) {
            throw new NotFoundException('Maintenance request not found');
        }

        const nextRoomId = data.room_id ?? maintenance.room_id;
        const nextTenantId = data.tenant_id ?? maintenance.tenant_id;
        await this.ensureRoomAndTenantExist(nextRoomId, nextTenantId);

        const updateData: any = {
            ...data,
            updated_at: new Date(),
        };

        const merged = this.maintenanceRepository.merge(maintenance, updateData);
        await this.maintenanceRepository.save(merged);

        return this.findOne(maintenanceId);
    }

    async delete(maintenanceId: string) {
        this.ensureValidMaintenanceId(maintenanceId);

        const result = await this.maintenanceRepository.delete({ id: maintenanceId });
        if (result.affected === 0) {
            throw new NotFoundException('Maintenance request not found');
        }

        return {
            message: 'Maintenance request deleted successfully',
            maintenanceId,
        };
    }
}
