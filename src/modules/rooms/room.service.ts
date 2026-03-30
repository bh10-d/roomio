import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository} from "@nestjs/typeorm";
import { Brackets, Repository, SelectQueryBuilder } from "typeorm";
import { Floor } from "src/modules/floors/entities/floor.entity";

import { Room } from "./entities/room.entity";
import { CreateRoomDto } from "./dto/create-room.dto";
import { ListRoomQueryDto } from "./dto/ListRoomQuery.dto";
import { RoomResponseDto } from "./dto/response-room.dto";
import { UpdateRoomDto } from "./dto/update-room.dto";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";

type Actor = Pick<JwtPayload, 'sub' | 'role'>;

type SummaryParams = {
    page: number;
    limit: number;
    search?: string;
    sortColumn: string;
    sortOrder: 'ASC' | 'DESC';
};
    
@Injectable()
export class RoomService {
    constructor(
        @InjectRepository(Room)
        private roomRepository: Repository<Room>,
        @InjectRepository(Floor)
        private floorRepository: Repository<Floor>,
    ) {}

    private ensureActor(actor?: Actor): Actor {
        if (!actor?.sub || !actor?.role) {
            throw new ForbiddenException('Missing auth actor');
        }

        return actor;
    }

    private applyReadScope(qb: SelectQueryBuilder<Room>, actor: Actor) {
        if (actor.role === 'admin') {
            return qb;
        }

        if (actor.role === 'landlord') {
            return qb
                .innerJoin('room.floor', 'scope_floor')
                .innerJoin('scope_floor.house', 'scope_house')
                .andWhere('scope_house.landlord_id = :actorId', { actorId: actor.sub });
        }

        if (actor.role === 'tenant') {
            return qb
                .innerJoin('room.roomUsers', 'scope_room_user')
                .andWhere('scope_room_user.user_id = :actorId', { actorId: actor.sub });
        }

        return qb.andWhere('1=0');
    }

    private async assertFloorWritableByActor(floorId: string, actor: Actor): Promise<void> {
        if (actor.role === 'admin') {
            const floorExists = await this.floorRepository.exist({ where: {id: floorId} });

            if (!floorExists) { 
                throw new BadRequestException('Invalid floor_id');
            }

            return;
        }

        if (actor.role !== 'landlord') {
            throw new ForbiddenException('No permission for this floor');
        }

        const floor = await this.floorRepository
            .createQueryBuilder('floor')
            .innerJoin('floor.house', 'house')
            .where('floor.id = :floorId', { floorId })
            .andWhere('house.landlord_id = :actorId', { actorId: actor.sub })
            .getOne();

        if (!floor) {
            throw new ForbiddenException('No permission for this floor');
        }
    }

    private async assertRoomWritableByActor(roomId: string, actor: Actor): Promise<Room> {
        const qb = this.roomRepository
            .createQueryBuilder('room')
            .where('room.id = :roomId', { roomId });

        if (actor.role !== 'admin') {
            if (actor.role !== 'landlord') {
                throw new ForbiddenException('No permission to modify this room');
            }

            this.applyReadScope(qb, actor);
        }

        const room = await qb.getOne();
        if (!room) {
            throw new NotFoundException('Room not found');
        }

        return room;
    }

    private resolveSummaryParams(query?: ListRoomQueryDto): SummaryParams {
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

        return {
            page,
            limit,
            search,
            sortColumn,
            sortOrder,
        };
    }

    private buildSummaryBaseQuery() {
        return this.roomRepository
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
    }

    private applyFloorFilter(qb: SelectQueryBuilder<Room>, floorId?: string) {
        if (floorId) {
            qb.where('room.floor_id = :floorId', { floorId });
        }
    }

    private applySearchFilter(qb: SelectQueryBuilder<Room>, search?: string) {
        if (search) {
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
    }

    private applySortAndPaging(qb: SelectQueryBuilder<Room>, params: SummaryParams) {
        qb.orderBy(params.sortColumn, params.sortOrder);
        qb.offset((params.page - 1) * params.limit);
        qb.limit(params.limit);
    }

    private buildSummaryQuery(floorId?: string, query?: ListRoomQueryDto) {
        const params = this.resolveSummaryParams(query);

        const qb = this.buildSummaryBaseQuery();

        this.applyFloorFilter(qb, floorId);
        this.applySearchFilter(qb, params.search);
        this.applySortAndPaging(qb, params);

        return qb;
    }

    async findAllSummary(query: ListRoomQueryDto, actor?: Actor) {
        const resolvedActor = this.ensureActor(actor);
        const page = query?.page || 1;
        const limit = query?.limit || 10;

        const qb = this.buildSummaryQuery(undefined, query);
        this.applyReadScope(qb, resolvedActor);
        const rows = await qb.getRawMany();
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

    async findOne(roomId: string, actor?: Actor): Promise<{data: RoomResponseDto[]}> {
        const resolvedActor = this.ensureActor(actor);

        // Truy vấn chi tiết room và gắn scope theo actor để chặn horizontal access.
        const qb = this.roomRepository
            .createQueryBuilder('room')
            .leftJoinAndSelect('room.bills', 'bills')
            .leftJoinAndSelect('room.contracts', 'contracts')
            .leftJoinAndSelect('room.roomUsers', 'roomUsers')
            .where('room.id = :roomId', { roomId });

        this.applyReadScope(qb, resolvedActor);

        const room = await qb.getOne();

        if (!room) {
            throw new NotFoundException(`Room with id ${roomId} not found`);
        }
        return { data: [room] };
    }

    async findByFloor(floorId: string, actor?: Actor) {
        const resolvedActor = this.ensureActor(actor);

        const qb = this.roomRepository
            .createQueryBuilder('room')
            .where('room.floor_id = :floorId', { floorId })
            .orderBy('room.name', 'ASC')
            .distinct(true);

        this.applyReadScope(qb, resolvedActor);

        return await qb.getMany();
    }

    async create(data: CreateRoomDto, actor?: Actor) {
        const resolvedActor = this.ensureActor(actor);
        await this.assertFloorWritableByActor(data.floor_id, resolvedActor);

        const room = this.roomRepository.create(data);
        const roomCreated = await this.roomRepository.save(room);
        return { data: roomCreated };
    }

    async update(roomId: string, data: UpdateRoomDto, actor?: Actor) {
        const resolvedActor = this.ensureActor(actor);
        const room = await this.assertRoomWritableByActor(roomId, resolvedActor);

        if (data.floor_id && data.floor_id !== room.floor_id) {
            await this.assertFloorWritableByActor(data.floor_id, resolvedActor);
        }

        const updateRoom = this.roomRepository.merge(room, data);
        const updateRoomSaved = await this.roomRepository.save(updateRoom);
        return { data: updateRoomSaved };
    }

    async delete(roomId: string, actor?: Actor) {
        const resolvedActor = this.ensureActor(actor);
        const room = await this.assertRoomWritableByActor(roomId, resolvedActor);
        await this.roomRepository.remove(room);

        return { 
            message: 'Room deleted successfully',
            roomId,
        };
    }
}