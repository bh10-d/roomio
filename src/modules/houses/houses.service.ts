import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository} from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { House } from "./entities/house.entity";
import { CreateHouseDto } from "./dto/create-house.dto";
import { HouseResponseDto, HouseSummaryResponseDto, HouseSummaryResponseQueryDto, HouseTreeResponseDto } from "./dto/response-house.dto";
import { UpdateHouseDto } from "./dto/update-house.dto";
import { ListHouseQueryDto } from "./dto/ListHouseQuery.dto";
import { HouseStaffResponseDto } from "./dto/response-house-staff.dto";
import { HouseStaff } from "./entities/house-staff.entity";
import { CreateHouseStaffDto } from "./dto/create-house-staff.dto";
import { UpdateHouseStaffDto } from "./dto/update-house-staff.dto";
import { User } from "../users/entities/user.entity";

@Injectable()
export class HouseService {
    constructor(
        @InjectRepository(House)
        private houseRepository: Repository<House>,
        @InjectRepository(HouseStaff)
        private houseStaffRepository: Repository<HouseStaff>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) {}

    private buildSummaryQuery(landlordId?: string, query?: ListHouseQueryDto) {
        const page =  query?.page || 1;
        const limit = query?.limit || 10;
        const search = query?.search?.trim();
        const sortBy = query?.sortBy ?? 'created_at';
        const sortOrder = query?.sortOrder ?? 'DESC';

        const sortMap = {
            name: 'house.name',
            address: 'house.address',
            created_at: 'house.created_at',
        }

        const sortColumn = sortMap[sortBy] ?? 'house.created_at';

        const qb = this.houseRepository
        .createQueryBuilder('house')
        .leftJoin('house.floors', 'floor')
        .leftJoin('floor.rooms', 'room')
        .select('house.id', 'id')
        .addSelect('house.name', 'name')
        .addSelect('house.address', 'address')
        .addSelect('house.landlord_id', 'landlord_id')
        .addSelect('COUNT(DISTINCT floor.id)', 'total_floors')
        .addSelect('COUNT(room.id)', 'total_rooms')
        .addSelect(
            `COALESCE(SUM(CASE WHEN room.status = 'available' THEN 1 ELSE 0 END), 0)`,
            'available_rooms',
        )
        .addSelect(
            `COALESCE(SUM(CASE WHEN room.status = 'occupied' THEN 1 ELSE 0 END), 0)`,
            'occupied_rooms',
        )
        .addSelect('COUNT(*) OVER()', 'total_count')
        .groupBy('house.id')
        .addGroupBy('house.name')
        .addGroupBy('house.address')
        .addGroupBy('house.landlord_id')
        .orderBy('house.created_at', 'DESC');

        if (landlordId) {
            qb.where('house.landlord_id = :landlordId', { landlordId });
        }

        if (search) {
            qb.andWhere('(house.name ILIKE :search OR house.address ILIKE :search)', {
                search: `%${search}%`,
            });
        }

        qb.orderBy(sortColumn, sortOrder);
        qb.offset((page - 1) * limit);
        qb.limit(limit);
        return qb;
    }

    private toSummaryResponse(row: any): HouseSummaryResponseDto {
        return {
            id: row.id,
            name: row.name,
            address: row.address,
            landlord_id: row.landlord_id,
            total_floors: Number(row.total_floors),
            total_rooms: Number(row.total_rooms),
            available_rooms: Number(row.available_rooms),
            occupied_rooms: Number(row.occupied_rooms),
        };
    }

    private toTreeResponse(house: House): HouseTreeResponseDto {
        return {
            id: house.id,
            name: house.name,
            address: house.address,
            landlord_id: house.landlord_id,
            floors: (house.floors || []).map((f) => ({
                id: f.id,
                floor_no: f.floor_no,
                rooms: (f.rooms || []).map((r) => ({
                    id: r.id,
                    name: r.name,
                    price: r.price,
                    capacity: r.capacity,
                    status: r.status,
                })),
            })),
        };
    }

    async findOne(id: string): Promise<HouseResponseDto> {
        const house = await this.houseRepository.findOne({ where: {id} });
        if (!house) {
            throw new NotFoundException('House not found');
        }

        return house;
    }

    async findAllSummary(query: ListHouseQueryDto): Promise<HouseSummaryResponseQueryDto> {
        const page = query?.page || 1;
        const limit = query?.limit || 10;
        const rows = await this.buildSummaryQuery(undefined, query).getRawMany();
        const total = rows.length > 0 ? Number(rows[0].total_count) : 0;

        return {
            data: rows.map(row => this.toSummaryResponse(row)),
            meta: {
                page,
                limit,
                total,
                totalPages: total > 0 ? Math.ceil(total / limit) : 0,
            },
        };
        // return rows.map(row => this.toSummaryResponse(row));
    }

    async findByLandLordSummary(landlordId: string, query: ListHouseQueryDto): Promise<HouseSummaryResponseQueryDto> {
        const page = query?.page || 1;
        const limit = query?.limit || 10;
        const rows = await this.buildSummaryQuery(landlordId, query).getRawMany();
        const total = rows.length > 0 ? Number(rows[0].total_count) : 0;

        return {
            data: rows.map(row => this.toSummaryResponse(row)),
            meta: {
                page,
                limit,
                total,
                totalPages: total > 0 ? Math.ceil(total / limit) : 0,
            },
        };
        // const rows = await this.buildSummaryQuery(landlordId, query).getRawMany();
        // return rows.map(row => this.toSummaryResponse(row));
    }

    async findOneTree(id: string): Promise<HouseTreeResponseDto> {
        const house = await this.houseRepository.findOne({
            where: {id},
            relations: ['floors', 'floors.rooms'],
            order: { floors: { floor_no: 'ASC' } }
        });

        if (!house) {
            throw new NotFoundException('House not found');
        }
        return this.toTreeResponse(house);
    }

    create(data: CreateHouseDto) {
        const house = this.houseRepository.create(data);
        return this.houseRepository.save(house);
    }

    async update(id: string, data: UpdateHouseDto) {
        const house = await this.houseRepository.findOne({ where: { id } });

        if (!house) {
            throw new NotFoundException('House not found');
        }

        const updatedHouse = this.houseRepository.merge(house, data);
        return this.houseRepository.save(updatedHouse);
    }

    async delete(id: string) {
        const result = await this.houseRepository.delete(id);

        if (!result.affected) {
            throw new NotFoundException('House not found');
        }

        return {
            message: 'Delete house successfully',
            id,
        };
    }

    async getHouseStaff(houseId: string): Promise<HouseStaffResponseDto[]> {
        const house = await this.houseRepository.findOne({
            where: { id: houseId }
        });

        if (!house) {
            throw new NotFoundException('House not found');
        }

        const staff = await this.houseStaffRepository.find({
            where: { house_id: houseId },
        });

        return staff;
    }

    async addStaffToHouse(
        houseId: string,
        data: CreateHouseStaffDto
    ): Promise<HouseStaffResponseDto> {
        const house = await this.houseRepository.findOne({
            where: { id: houseId }
        });

        if (!house) {
            throw new NotFoundException('House not found');
        }

        const user = await this.userRepository.findOne({
            where: { id: data.user_id }
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const houseStaff = this.houseStaffRepository.create({
            ...data,
            house_id: houseId
        });

        await this.houseStaffRepository.save(houseStaff);

        return houseStaff;
    }

    async updateHouseStaff(houseId: string, staffId: string, data: UpdateHouseStaffDto): Promise<HouseStaffResponseDto> {
        const house = await this.houseRepository.findOne({
            where : { id: houseId}
        });

        if (!house) {
            throw new NotFoundException('House not found');
        }

        const staff = await this.houseStaffRepository.findOne({
            where: { id: staffId, house_id: houseId }
        });

        if (!staff) {
            throw new NotFoundException('Staff not found in this house');
        }

        const updatedStaff = this.houseStaffRepository.merge(staff, data);
        await this.houseStaffRepository.save(updatedStaff);

        return updatedStaff;
    }


    async removeStaffFromHouse(houseId: string, staffId: string): Promise<{ message: string }> {
        const house = await this.houseRepository.findOne({
            where: { id: houseId }
        })

        if (!house) {
            throw new NotFoundException('House not found');
        }

        const staff = await this.houseStaffRepository.findOne({
            where: { id: staffId, house_id: houseId }
        });

        if (!staff) {
            throw new NotFoundException('Staff not found in this house');
        }

        await this.houseStaffRepository.remove(staff);

        return { message: 'Staff removed from house successfully' };

    }
}