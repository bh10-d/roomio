import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository} from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { House } from "./entities/house.entity";
import { CreateHouseDto } from "./dto/create-house.dto";
import { HouseResponseDto, HouseSummaryResponseDto, HouseTreeResponseDto } from "./dto/response-house.dto";

type HouseSummary = {
    id: string;
    name: string;
    address: string;
    landlord_id: string;
    total_floors: number;
    total_rooms: number;
    available_rooms: number;
    occupied_rooms: number;
}

@Injectable()
export class HouseService {
    constructor(
        @InjectRepository(House)
        private houseRepository: Repository<House>,
    ) {}

    private buildSummaryQuery(landlordId?: string) {
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
        .groupBy('house.id')
        .addGroupBy('house.name')
        .addGroupBy('house.address')
        .addGroupBy('house.landlord_id')
        .orderBy('house.created_at', 'DESC');

        if (landlordId) {
            qb.where('house.landlord_id = :landlordId', { landlordId });
        }
        return qb;
    }

    // private toResponse(house: House): HouseResponseDto {
    //     return {
    //         id: house.id,
    //         landlord_id: house.landlord_id,
    //         name: house.name,
    //         address: house.address,
    //     };
    // }

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

    async findAllSummary(): Promise<HouseSummaryResponseDto[]> {
        const rows = await this.buildSummaryQuery().getRawMany();
        return rows.map(row => this.toSummaryResponse(row));
    }

    async findByLandLordSummary(landlordId: string): Promise<HouseSummaryResponseDto[]> {
        const rows = await this.buildSummaryQuery(landlordId).getRawMany();
        return rows.map(row => this.toSummaryResponse(row));
    }

    async findOneTree(id: string): Promise<HouseTreeResponseDto> {
        const house = await this.houseRepository.findOne({
            where: {id},
            relations: ['floors', 'floors.rooms'],
            order: { floors: { floor_no: 'ASC' } }
        });

        if (!house) {
            throw new Error('House not found');
        }
        return this.toTreeResponse(house);
    }

    // async findAll(): Promise<HouseResponseDto[]> {
    //     const house = await this.houseRepository.find({ relations: ['floors'] });
    //     return house.map((h) => this.toResponse(h));
    // }

    create(data: CreateHouseDto) {
        const house = this.houseRepository.create(data);
        return this.houseRepository.save(house);
    }

    // async findOneTree(id: string) {
    //     const house = await this.houseRepository.findOne({
    //         where: {id},
    //         relations: ['floors', 'floors.rooms'],
    //         order: {
    //             floors: { floor_no: 'ASC' }
    //         },
    //     });

    //     if(!house) {
    //         throw new Error('House not found');
    //     }

    //     return house;
    // }

    // async findOne(landlordId: string) {
    //     const house = await this.houseRepository.find({
    //         where: {landlord_id: landlordId},
    //         order: { created_at: 'DESC' }
    //     });
    //     if (!house) {
    //         throw new Error('House not found');
    //     }
    //     return house;
    // }
}