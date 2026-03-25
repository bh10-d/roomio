import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MeterReading } from './entities/meter-reading.entity';
import { Room } from 'src/modules/rooms/entities/room.entity';
import { CreateMeterDto } from './dto/create-meter.dto';
import { UpdateMeterDto } from './dto/update-meter.dto';
import { ListMeterQueryDto } from './dto/ListMeterQuery.dto';
import { MeterResponseDto } from './dto/response-meter.dto';

@Injectable()
export class MetersService {
    constructor(
        @InjectRepository(MeterReading)
        private metersRepository: Repository<MeterReading>,
        @InjectRepository(Room)
        private roomRepository: Repository<Room>,
    ) {}

    private buildSummaryQuery(query?: ListMeterQueryDto) {
        const page = query?.page || 1;
        const limit = query?.limit || 10;
        const search = query?.search?.trim();
        const sortBy = query?.sortBy ?? 'month';
        const sortOrder = query?.sortOrder ?? 'DESC';

        const sortMap = {
            month: 'meter.month',
            type: 'meter.type',
            previous_reading: 'meter.previous_reading',
            current_reading: 'meter.current_reading',
        };

        const sortColumn = sortMap[sortBy] ?? 'meter.month';

        const qb = this.metersRepository
            .createQueryBuilder('meter')
            .leftJoin('meter.room', 'room')
            .select('meter.id', 'id')
            .addSelect('meter.room_id', 'room_id')
            .addSelect('meter.type', 'type')
            .addSelect('meter.previous_reading', 'previous_reading')
            .addSelect('meter.current_reading', 'current_reading')
            .addSelect('meter.month', 'month')
            .addSelect('room.id', 'room_ref_id')
            .addSelect('room.floor_id', 'room_floor_id')
            .addSelect('room.name', 'room_name')
            .addSelect('COUNT(*) OVER()', 'total_count');

        if (search) {
            qb.andWhere(
                '(room.name ILIKE :search OR meter.type ILIKE :search OR CAST(meter.previous_reading AS TEXT) ILIKE :search OR CAST(meter.current_reading AS TEXT) ILIKE :search OR CAST(meter.month AS TEXT) ILIKE :search)',
                { search: `%${search}%` },
            );
        }

        qb.orderBy(sortColumn, sortOrder);
        qb.offset((page - 1) * limit);
        qb.limit(limit);

        return qb;
    }

    private toResponse(meter: MeterReading): MeterResponseDto {
        return {
            id: meter.id,
            room_id: meter.room_id,
            type: meter.type,
            previous_reading: Number(meter.previous_reading),
            current_reading: Number(meter.current_reading),
            month: meter.month,
            room: {
                id: meter.room.id,
                floor_id: meter.room.floor_id,
                name: meter.room.name,
            },
        }
    }

    private ensureValidMeterId(meterId: string) {
        if (!meterId || typeof meterId !== 'string') {
            throw new BadRequestException('Invalid meter_id');
        }
    }

    private parseMonth(month: string): Date {
        const parsedDate = new Date(month);
        if (Number.isNaN(parsedDate.getTime())) {
            throw new BadRequestException('Invalid month');
        }
        return parsedDate;
    }

    private validateReading(previousReading: number, currentReading: number) {
        if (currentReading < previousReading) {
            throw new BadRequestException('current_reading must be greater than or equal to previous_reading');
        }
    }

    private async ensureRoomExists(roomId: string) {
        const roomExists = await this.roomRepository.exist({ where: { id: roomId } });
        if (!roomExists) {
            throw new BadRequestException('Invalid room_id');
        }
    }

    async findAllSummary(query: ListMeterQueryDto) {
        const page = query?.page || 1;
        const limit = query?.limit || 10;

        const rows = await this.buildSummaryQuery(query).getRawMany();
        const total = rows.length > 0 ? Number(rows[0].total_count) : 0;

        return {
            data: rows.map(row => ({
                id: row.id,
                room_id: row.room_id,
                type: row.type,
                previous_reading: Number(row.previous_reading),
                current_reading: Number(row.current_reading),
                month: row.month,
                room: {
                    id: row.room_ref_id,
                    floor_id: row.room_floor_id,
                    name: row.room_name,
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

    async findOne(meterId: string): Promise<{data: MeterResponseDto}> {
        this.ensureValidMeterId(meterId);

        const meter = await this.metersRepository.findOne({
            where: { id: meterId },
            relations: ['room'],
        });

        if (!meter) {
            throw new NotFoundException('Meter reading not found');
        }

        return { data: this.toResponse(meter) };
    }

    async create(data: CreateMeterDto) {
        await this.ensureRoomExists(data.room_id);
        this.validateReading(data.previous_reading, data.current_reading);

        const meter = this.metersRepository.create({
            ...data,
            month: this.parseMonth(data.month),
        });
        const meterSaved = await this.metersRepository.save(meter);

        return this.findOne(meterSaved.id);
    }

    async update(meterId: string, data: UpdateMeterDto) {
        this.ensureValidMeterId(meterId);

        const meter = await this.metersRepository.findOne({ where: { id: meterId } });
        if (!meter) {
            throw new NotFoundException('Meter reading not found');
        }

        const nextRoomId = data.room_id ?? meter.room_id;
        await this.ensureRoomExists(nextRoomId);

        const nextPreviousReading = data.previous_reading ?? Number(meter.previous_reading);
        const nextCurrentReading = data.current_reading ?? Number(meter.current_reading);
        this.validateReading(nextPreviousReading, nextCurrentReading);

        const updateData: any = { ...data };
        if (data.month) {
            updateData.month = this.parseMonth(data.month);
        }

        const merged = this.metersRepository.merge(meter, updateData);
        await this.metersRepository.save(merged);

        return this.findOne(meterId);
    }

    async delete(meterId: string) {
        this.ensureValidMeterId(meterId);

        const result = await this.metersRepository.delete({ id: meterId });
        if (result.affected === 0) {
            throw new NotFoundException('Meter reading not found');
        }

        return {
            message: 'Meter reading deleted successfully',
            meterId,
        };
    }
}
