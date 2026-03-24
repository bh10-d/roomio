import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Room } from 'src/modules/rooms/entities/room.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { Contract } from './entities/contract.entity';
import { ListContractQueryDto } from './dto/ListContractQuery.dto';
import { ContractResponseDto } from './dto/response-contract.dto';

@Injectable()
export class ContractService {
    constructor(
        @InjectRepository(Contract)
        private contractRepository: Repository<Contract>,
        @InjectRepository(Room)
        private roomRepository: Repository<Room>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) {}

    private buildSummaryQuery(contractId?: string, query?: ListContractQueryDto) {
        const page = query?.page || 1;
        const limit = query?.limit || 10;
        const search = query?.search?.trim();
        const sortBy = query?.sortBy ?? 'created_at';
        const sortOrder = query?.sortOrder ?? 'DESC';

        const sortMap = {
            created_at: 'contract.created_at',
            start_date: 'contract.start_date',
            end_date: 'contract.end_date',
            status: 'contract.status',
            deposit_amount: 'contract.deposit_amount',
        };

        const sortColumn = sortMap[sortBy] ?? 'contract.created_at';

        const qb = this.contractRepository
        .createQueryBuilder('contract')
        .leftJoin('contract.room', 'room')
        .leftJoin('contract.tenant', 'tenant')
        .select('contract.id', 'id')
        .addSelect('contract.room_id', 'room_id')
        .addSelect('contract.tenant_id', 'tenant_id')
        .addSelect('contract.start_date', 'start_date')
        .addSelect('contract.end_date', 'end_date')
        .addSelect('contract.status', 'status')
        .addSelect('contract.deposit_amount', 'deposit_amount')
        .addSelect('contract.created_at', 'created_at')
        .addSelect('contract.updated_at', 'updated_at')
        .addSelect('room.id', 'room_id')
        .addSelect('room.floor_id', 'room_floor_id')
        .addSelect('room.name', 'room_name')
        .addSelect('room.price', 'room_price')
        .addSelect('room.capacity', 'room_capacity')
        .addSelect('room.status', 'room_status')
        .addSelect('tenant.id', 'tenant_id')
        .addSelect('tenant.name', 'tenant_name')
        .addSelect('tenant.email', 'tenant_email')
        .addSelect('tenant.phone', 'tenant_phone')
        // .addSelect('COUNT(contract.id)', 'total_contracts')
        .addSelect('COUNT(*) OVER()', 'total_count')
        .groupBy('contract.id')
        .addGroupBy('room.id')
        .addGroupBy('tenant.id')

        if (contractId) {
            qb.where('contract.id = :contractId', { contractId });
        }

        if (search) {
            qb.andWhere(
                '(CAST(contract.start_date AS TEXT) ILIKE :search OR CAST(contract.end_date AS TEXT) ILIKE :search OR contract.status ILIKE :search)',
                { search: `%${search}%` },
            );
        }

        qb.orderBy(sortColumn, sortOrder);
        qb.offset((page - 1) * limit);
        qb.limit(limit);

        return qb;
    }

    private toResponse(contract: Contract): ContractResponseDto {
        return {
            id: contract.id,
            room_id: contract.room_id,
            tenant_id: contract.tenant_id,
            start_date: contract.start_date,
            end_date: contract.end_date,
            status: contract.status,
            deposit_amount: contract.deposit_amount,
            created_at: contract.created_at,
            updated_at: contract.updated_at,
            room: {
                id: contract.room.id,
                floor_id: contract.room.floor_id,
                name: contract.room.name,
                price: contract.room.price,
                capacity: contract.room.capacity,
                status: contract.room.status,
            },
            tenant: {
                id: contract.tenant.id,
                name: contract.tenant.name,
                email: contract.tenant.email,
                phone: contract.tenant.phone,
            },
        }
    }

    // async findAll() {
    //     const contracts = await this.contractRepository.find({
    //         relations: ['room', 'tenant'],
    //         order: { created_at: 'DESC' },
    //     });

    //     return { data: contracts };
    // }

    async findAllSummary(query: ListContractQueryDto) {
        const page = query?.page || 1;
        const limit = query?.limit || 10;

        const rows = await this.buildSummaryQuery(undefined, query).getRawMany();
        const total = rows.length > 0 ? Number(rows[0].total_count): 0;

        return {
            data: rows.map(row => ({
                id: row.id,
                room_id: row.room_id,
                tenant_id: row.tenant_id,
                start_date: row.start_date,
                end_date: row.end_date,
                status: row.status,
                deposit_amount: row.deposit_amount,
                created_at: row.created_at,
                updated_at: row.updated_at,
                room: {
                    id: row.room_id,
                    floor_id: row.room_floor_id,
                    name: row.room_name,
                    price: row.room_price,
                    capacity: row.room_capacity,
                    status: row.room_status,
                },
                tenant: {
                    id: row.tenant_id,
                    name: row.tenant_name,
                    email: row.tenant_email,
                    phone: row.tenant_phone,
                },
            })),
            meta: {
                page,
                limit,
                total,
                totalPages: total > 0 ? Math.ceil(total / limit) : 0,
            }
        }
    }

    async findOne(contractId: string): Promise<{data: ContractResponseDto}> {
        const contract = await this.contractRepository.findOne({
            where: { id: contractId },
            relations: ['room', 'tenant'],
        });

        if (!contract) {
            throw new NotFoundException('Contract not found');
        }

        return { data: this.toResponse(contract) };
    }

    async create(data: CreateContractDto) {
        await this.ensureRoomAndTenantExist(data.room_id, data.tenant_id);
        this.validateDateRange(data.start_date, data.end_date);
        const contractStatus = data.status ?? 'active';

        if (contractStatus === 'active') {
            await this.ensureRoomHasNoOtherActiveContract(data.room_id);
        }

        const contract = this.contractRepository.create({
            ...data,
            start_date: this.parseLocalDate(data.start_date),
            end_date: this.parseLocalDate(data.end_date),
            status: contractStatus,
        });

        const contractCreated = await this.contractRepository.save(contract);

        return this.findOne(contractCreated.id);
    }

    async update(contractId: string, data: UpdateContractDto) {
        const contract = await this.contractRepository.findOne({ where: { id: contractId } });
        if (!contract) {
            throw new NotFoundException('Contract not found');
        }

        const nextRoomId = data.room_id ?? contract.room_id;
        const nextTenantId = data.tenant_id ?? contract.tenant_id;
        await this.ensureRoomAndTenantExist(nextRoomId, nextTenantId);

        const nextStartDate = data.start_date ?? this.toISODateString(contract.start_date);
        const nextEndDate = data.end_date ?? this.toISODateString(contract.end_date);
        this.validateDateRange(nextStartDate, nextEndDate);

        const nextStatus = data.status ?? contract.status;
        if (nextStatus === 'active') {
            await this.ensureRoomHasNoOtherActiveContract(nextRoomId, contract.id);
        }

        const updateData: any = { ...data, status: nextStatus };
        if (data.start_date) {
            updateData.start_date = this.parseLocalDate(data.start_date);
        }
        if (data.end_date) {
            updateData.end_date = this.parseLocalDate(data.end_date);
        }

        const merged = this.contractRepository.merge(contract, updateData);
        await this.contractRepository.save(merged);

        return this.findOne(contractId);
    }

    async delete(contractId: string) {
        const result = await this.contractRepository.delete({ id: contractId });
        if (result.affected === 0) {
            throw new NotFoundException('Contract not found');
        }

        return {
            message: 'Contract deleted successfully',
            contractId,
        };
    }

    private validateDateRange(startDate: string, endDate: string) {
        const start = this.parseLocalDate(startDate);
        const end = this.parseLocalDate(endDate);

        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            throw new BadRequestException('Invalid contract date range');
        }

        if (start >= end) {
            throw new BadRequestException('start_date must be earlier than end_date');
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

    private async ensureRoomHasNoOtherActiveContract(roomId: string, ignoreContractId?: string) {
        const existingContracts = await this.contractRepository.find({
            where: { room_id: roomId, status: 'active' },
            select: ['id'],
        });

        const hasConflict = ignoreContractId
            ? existingContracts.some((contract) => contract.id !== ignoreContractId)
            : existingContracts.length > 0;

        if (hasConflict) {
            throw new BadRequestException('Room already has an active contract');
        }
    }

    private toISODateString(value: Date | string) {
        if (value instanceof Date) {
            return value.toISOString();
        }

        return value;
    }


    // TODO(timezone): start_date/end_date can shift by timezone when using timestamp.
    // Consider switching contract dates to PostgreSQL DATE type or strict UTC date-only handling.
    private parseLocalDate(dateStr: string): Date {
        // Parse YYYY-MM-DD as local time in UTC+7, then convert to UTC for storage
        const [year, month, day] = dateStr.split('-').map(Number);
        const localDate = new Date(year, month - 1, day, 0, 0, 0, 0);
        // Offset by +7 hours to store the equivalent UTC time
        // return new Date(localDate.getTime() + 7 * 60 * 60 * 1000);
        return new Date(localDate.getTime());
    }
}