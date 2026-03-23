import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository} from "@nestjs/typeorm";
import { Brackets, Repository } from "typeorm";
import { Floor } from "src/modules/floors/entities/floor.entity";

import { Room } from "./entities/room.entity";
import { CreateRoomDto } from "./dto/create-room.dto";
import { ListRoomQueryDto } from "./dto/ListRoomQuery.dto";
import { RoomResponseDto } from "./dto/response-room.dto";
import { UpdateRoomDto } from "./dto/update-room.dto";

@Injectable()
export class RoomService {
    constructor(
        @InjectRepository(Room)
        private roomRepository: Repository<Room>,
        @InjectRepository(Floor)
        private floorRepository: Repository<Floor>,
    ) {}

    private buildSummaryQuery(floorId?: string, query?: ListRoomQueryDto) {
        const page = query?.page || 1;
        const limit = query?.limit || 10;
        const search = query?.search?.trim();
        const sortBy = query?.sortBy ?? 'status';
        const sortOrder = query?.sortOrder ?? 'DESC';

        const sortMap = {
            price: 'room.price',
            capacity: 'room.capacity',
            status: 'room.status',
        }

        const sortColumn = sortMap[sortBy] ?? 'room.status';


        const qb = this.roomRepository
        .createQueryBuilder('room')
        .leftJoin('room.floor', 'floor')
        .select('room.id', 'id')
        .addSelect('room.floor_id', 'floor_id')
        .addSelect('room.capacity', 'capacity')
        .addSelect('room.price', 'price')
        .addSelect('room.status', 'status')
        .addSelect('COUNT(*) OVER()', 'total_count')
        .groupBy('room.id')
        .addGroupBy('room.capacity')
        .addGroupBy('room.price')
        .addGroupBy('room.status');


        if (floorId) {
            qb.where('room.floor_id = :floorId', {floorId});
        }

        // if (search) {
        //     qb.andWhere('CAST (room.price AS TEXT) ILIKE :search', {
        //         search: `%${search}%`,
        //     })
        //     .orWhere('CAST (room.capacity AS TEXT) ILIKE :search', {
        //         search: `%${search}%`,
        //     })
        //     .orWhere('CAST (room.status AS TEXT) ILIKE :search', {
        //         search: `%${search}%`,
        //     });
        // }

        if (search) {
            // Group OR conditions in brackets so they stay under the same AND filter (e.g. floor_id AND (...)).
            qb.andWhere(
                new Brackets((searchQb) => {
                    searchQb
                        .where('CAST(room.price AS TEXT) ILIKE :search')
                        .orWhere('CAST(room.capacity AS TEXT) ILIKE :search')
                        .orWhere('CAST(room.status AS TEXT) ILIKE :search');
                }),
                { search: `%${search}%` },
            );
        }

        qb.orderBy(sortColumn, sortOrder);
        qb.offset((page - 1) * limit);
        qb.limit(limit);

        return qb;
    }

    async findAllSummary(query: ListRoomQueryDto) {
        const page = query?.page || 1;
        const limit = query?.limit || 10;

        const rows = await this.buildSummaryQuery(undefined, query).getRawMany();
        const total = rows.length > 0 ? Number(rows[0].total_count): 0;

        return {
            data: rows.map(row => ({
                id: row.id,
                floor_id: row.floor_id,
                price: row.price,
                capacity: row.capacity,
                status: row.status,
            })),
            meta: {
                page,
                limit,
                total,
            }
        }
    }

    async findOne(roomId: string): Promise<{data: RoomResponseDto[]}> {
        //thằng này sẽ trả về thông tin chi tiết của room bao gồm cả bill contract,  và room user (nếu có), nên sẽ dùng findOne với relations thay vì query builder như hàm findAllSummary.
        const room = await this.roomRepository.findOne({ 
            where: { id: roomId,  } ,
            relations: ['bills', 'contracts', 'roomUsers'],
        });
        

        if (!room) {
            throw new NotFoundException(`Room with id ${roomId} not found`);
        }
        return { data: [room] };
    }

    async findByFloor(floorId: string) {
        return await this.roomRepository.find({
            where: { floor_id: floorId },
            order: { name: 'ASC' },
        });
    }

    async create(data: CreateRoomDto) {
        const room = this.roomRepository.create(data);
        const roomCreated = await this.roomRepository.save(room);
        return { data: roomCreated };
    }

    async update(roomId: string, data: UpdateRoomDto) {
        const room = await this.roomRepository.findOne({ where: { id: roomId } });
        if (!room) {
            throw new NotFoundException('Room not found');
        }

        if (data.floor_id && data.floor_id !== room.floor_id) {
            // Validate floor_id before save to return a clean 400 instead of a DB foreign-key error.
            const floorExists = await this.floorRepository.exist({ where: { id: data.floor_id } });
            if (!floorExists) {
                throw new BadRequestException('Invalid floor_id');
            }
        }

        const updateRoom = this.roomRepository.merge(room, data);
        const updateRoomSaved = await this.roomRepository.save(updateRoom);
        return { data: updateRoomSaved };
    }

    async delete(roomId: string) {
        const room = await this.roomRepository.delete({ id: roomId });
        if (room.affected === 0) {
            throw new NotFoundException('Room not found');
        }
        return { 
            message: 'Room deleted successfully',
            roomId,
        };
    }
}