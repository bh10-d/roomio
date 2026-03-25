import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from 'src/modules/rooms/entities/room.entity';
import { Bill } from './entities/bill.entity';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { ListBillQueryDto } from './dto/ListBillQuery.dto';
import { BillResponseDto } from './dto/response-bill.dto';

@Injectable()
export class BillService {
    constructor(
        @InjectRepository(Bill)
        private billRepository: Repository<Bill>,
        @InjectRepository(Room)
        private roomRepository: Repository<Room>,
    ) {}

    private buildSummaryQuery(query?: ListBillQueryDto) {
        const page = query?.page || 1;
        const limit = query?.limit || 10;
        const search = query?.search?.trim();
        const sortBy = query?.sortBy ?? 'created_at';
        const sortOrder = query?.sortOrder ?? 'DESC';

        const sortMap = {
            month: 'bill.month',
            total_amount: 'bill.total_amount',
            status: 'bill.status',
            created_at: 'bill.created_at',
        };

        const sortColumn = sortMap[sortBy] ?? 'bill.created_at';

        const qb = this.billRepository
            .createQueryBuilder('bill')
            .leftJoin('bill.room', 'room')
            .select('bill.id', 'id')
            .addSelect('bill.room_id', 'room_id')
            .addSelect('bill.month', 'month')
            .addSelect('bill.total_amount', 'total_amount')
            .addSelect('bill.status', 'status')
            .addSelect('bill.created_at', 'created_at')
            .addSelect('bill.updated_at', 'updated_at')
            .addSelect('room.id', 'room_ref_id')
            .addSelect('room.floor_id', 'room_floor_id')
            .addSelect('room.name', 'room_name')
            .addSelect('COUNT(*) OVER()', 'total_count');

        if (search) {
            qb.andWhere(
                '(room.name ILIKE :search OR bill.status ILIKE :search OR CAST(bill.total_amount AS TEXT) ILIKE :search OR CAST(bill.month AS TEXT) ILIKE :search)',
                { search: `%${search}%` },
            );
        }

        qb.orderBy(sortColumn, sortOrder);
        qb.offset((page - 1) * limit);
        qb.limit(limit);

        return qb;
    }

    private toResponse(bill: Bill): BillResponseDto {
        return {
            id: bill.id,
            room_id: bill.room_id,
            month: bill.month,
            total_amount: Number(bill.total_amount),
            status: bill.status,
            created_at: bill.created_at,
            updated_at: bill.updated_at,
            room: bill.room
                ? {
                    id: bill.room.id,
                    floor_id: bill.room.floor_id,
                    name: bill.room.name,
                }
                : null,
            billItems: (bill.billItems || []).map((billItem) => ({
                id: billItem.id,
                bill_id: billItem.bill_id,
                type: billItem.type,
                amount: Number(billItem.amount),
                unit_price: Number(billItem.unit_price),
                quantity: Number(billItem.quantity),
                created_at: billItem.created_at,
                updated_at: billItem.updated_at,
            })),
            payments: (bill.payments || []).map((payment) => ({
                id: payment.id,
                bill_id: payment.bill_id,
                amount: Number(payment.amount),
                payment_date: payment.payment_date,
                method: payment.method,
                status: payment.status,
                created_at: payment.created_at,
                updated_at: payment.updated_at,
            })),
        }
    }

    async findAllSummary(query: ListBillQueryDto) {
        const page = query?.page || 1;
        const limit = query?.limit || 10;

        const rows = await this.buildSummaryQuery(query).getRawMany();
        const total = rows.length > 0 ? Number(rows[0].total_count) : 0;

        return {
            data: rows.map(row => ({
                id: row.id,
                room_id: row.room_id,
                month: row.month,
                total_amount: Number(row.total_amount),
                status: row.status,
                created_at: row.created_at,
                updated_at: row.updated_at,
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

    async findOne(billId: string): Promise<{data: BillResponseDto}> {
        const bill = await this.billRepository.findOne({
            where: { id: billId },
            relations: ['room', 'billItems', 'payments'],
        });

        if (!bill) {
            throw new NotFoundException('Bill not found');
        }

        return { data: this.toResponse(bill) };
    }

    private parseMonth(month: string): Date {
        const parsedDate = new Date(month);
        if (Number.isNaN(parsedDate.getTime())) {
            throw new BadRequestException('Invalid month');
        }
        return parsedDate;
    }

    private async ensureRoomExists(roomId: string) {
        const roomExists = await this.roomRepository.exist({ where: { id: roomId } });
        if (!roomExists) {
            throw new BadRequestException('Invalid room_id');
        }
    }

    async create(data: CreateBillDto) {
        await this.ensureRoomExists(data.room_id);

        const bill = this.billRepository.create({
            ...data,
            month: this.parseMonth(data.month),
        });
        const billSaved = await this.billRepository.save(bill);

        return this.findOne(billSaved.id);
    }

    async update(billId: string, data: UpdateBillDto) {
        const bill = await this.billRepository.findOne({ where: { id: billId } });
        if (!bill) {
            throw new NotFoundException('Bill not found');
        }

        const nextRoomId = data.room_id ?? bill.room_id;
        await this.ensureRoomExists(nextRoomId);

        const updateData: any = { ...data };
        if (data.month) {
            updateData.month = this.parseMonth(data.month);
        }

        const merged = this.billRepository.merge(bill, updateData);
        await this.billRepository.save(merged);

        return this.findOne(billId);
    }

    async delete(billId: string) {
        const result = await this.billRepository.delete({ id: billId });
        if (result.affected === 0) {
            throw new NotFoundException('Bill not found');
        }

        return {
            message: 'Bill deleted successfully',
            billId,
        };
    }
}