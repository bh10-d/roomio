import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository} from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Floor } from "./entities/floor.entity";
import { CreateFloorDto } from "./dto/create-floor.dto";
import { FloorResponseDto } from "./dto/response-floor.dto";
import { ListFloorQueryDto } from "./dto/ListFloorQuery.dto";
import { UpdateFloorDto } from "./dto/update-floor.dto";

@Injectable()
export class FloorService {
    constructor(
        @InjectRepository(Floor)
        private floorRepository: Repository<Floor>,
    ) {}

    private buildSummaryQuery(houseId?: string, query?: ListFloorQueryDto) {
        // 1) Chốt giá trị đầu vào: nếu client không truyền thì dùng mặc định.
        const page = query?.page || 1;
        const limit = query?.limit || 10;
        const search = query?.search?.trim();
        const sortBy = query?.sortBy ?? 'created_at';
        const sortOrder = query?.sortOrder ?? 'DESC';

        // 2) Danh sách cột được phép sort (whitelist), tránh sort bừa theo input từ client.
        const sortMap = {
            // house_id: 'floor.house_id',
            floor_no: 'floor.floor_no',
            created_at: 'floor.created_at',
        }

        // 3) Nếu sortBy không hợp lệ thì fallback về created_at để query luôn an toàn.
        const sortColumn = sortMap[sortBy] ?? 'floor.created_at';

        // 4) Dựng query gốc:
        // - lấy thông tin cơ bản của floor
        // - join rooms để đếm tổng phòng mỗi tầng
        // - dùng window function để lấy total_count phục vụ phân trang
        const qb = this.floorRepository
        .createQueryBuilder('floor')
        .leftJoin('floor.rooms', 'room')
        .select('floor.id', 'id')
        .addSelect('floor.house_id', 'house_id')
        .addSelect('floor.floor_no', 'floor_no')
        .addSelect('COUNT(room.id)', 'total_rooms')
        .addSelect('COUNT(*) OVER()', 'total_count')
        .groupBy('floor.id')
        .addGroupBy('floor.house_id')
        .addGroupBy('floor.floor_no')
        // 5) Filter theo nhà nếu truyền houseId.

        if (houseId) {
            qb.where('floor.house_id = :houseId', {houseId});
        }
        // 6) Filter search (ở đây tìm theo floor_no, ép sang text để dùng ILIKE).

        if (search) {
            qb.andWhere('CAST(floor.floor_no AS TEXT) ILIKE :search', {
                search: `%${search}%`,
            })
        }
        // 7) Áp dụng sắp xếp và phân trang.
        // offset = (page - 1) * limit là công thức chuẩn để nhảy đến đúng trang.

        qb.orderBy(sortColumn, sortOrder);
        qb.offset((page - 1) * limit);
        qb.limit(limit);
        // 8) Trả query builder để hàm gọi bên ngoài có thể execute bằng getRawMany().

        return qb;
    }

    private toResponse(floor: Floor): FloorResponseDto {
        return {
            id: floor.id,
            house_id: floor.house_id,
            floor_no: floor.floor_no,
            // name: floor.name,
            rooms: (floor.rooms || []).map((room) => ({
                id: room.id,
                floor_id: room.floor_id,
                name: room.name,
                price: room.price,
                capacity: room.capacity,
                status: room.status,
            })),
        };
    }

    // async findAll() {
    //     const floors = await this.floorRepository.find({ relations: ['rooms'], order: { floor_no: 'ASC' } });
    //     return floors.map(floor => this.toResponse(floor));
    // }

    async findAllSummary(query: ListFloorQueryDto) {
        const page = query?.page || 1;
        const limit = query?.limit || 10;

        const rows = await this.buildSummaryQuery(undefined, query).getRawMany();
        const total = rows.length > 0 ? Number(rows[0].total_count): 0;

        return {
            data: rows.map(row => ({
                id: row.id,
                house_id: row.house_id,
                floor_no: Number(row.floor_no),
                total_rooms: Number(row.total_rooms),
            })),
            meta: {
                page,
                limit,
                total,
                totalPages: total > 0 ? Math.ceil(total / limit) : 0,
            }
        }
    }

    // async findByHouse(houseId: string) {
    //     const floors = await this.floorRepository.find({
    //         where: { house_id: houseId },
    //         // relations: [ 'rooms' ],
    //         order: { floor_no: 'ASC' },
    //     });
    //     return floors;
    // }

    async findByHouseSummary(houseId: string, query: ListFloorQueryDto) {
        const page = query?.page || 1;
        const limit = query?.limit || 10;

        const rows = await this.buildSummaryQuery(houseId, query).getRawMany();
        const total = rows.length > 0 ? Number(rows[0].total_count): 0;

        return {
            data: rows.map(row => ({
                id: row.id,
                house_id: row.house_id,
                floor_no: Number(row.floor_no),
                total_rooms: Number(row.total_rooms),
            })),
            meta: {
                page,
                limit,
                total,
                totalPages: total > 0 ? Math.ceil(total / limit) : 0,
            }
        }
    }

    async findOne(id: string): Promise<{data: FloorResponseDto[]}> {
        const floor = await this.floorRepository.findOne({ where: { id }, relations: ['rooms'] });
        if (!floor) {
            throw new NotFoundException('Floor not found');
        }
        return { data: [this.toResponse(floor)] };
    }

    async create(data: CreateFloorDto): Promise<FloorResponseDto> {
        const floor = this.floorRepository.create(data);
        const floorCreateSaved = await this.floorRepository.save(floor);
        return this.toResponse(floorCreateSaved);
    }

    async update(id: string, data: UpdateFloorDto): Promise<FloorResponseDto> {
        const floor = await this.floorRepository.findOne({ where: { id } });

        if (!floor) {
            throw new NotFoundException('Floor not found');
        }

        const updateFloor = await this.floorRepository.merge(floor, data);
        const updateFloorSaved = await this.floorRepository.save(updateFloor);
        return this.toResponse(updateFloorSaved);
    }

    async delete(id: string): Promise<{ message: string; id: string }> {
        const result = await this.floorRepository.delete(id);
        
        if (result.affected === 0 ) {
            throw new NotFoundException('Floor not found');
        }

        return {
            message: 'Floor deleted successfully',
            id,
        }
    }
}