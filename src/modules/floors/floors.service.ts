import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, Repository, SelectQueryBuilder } from "typeorm";

import { Floor } from "./entities/floor.entity";
import { House } from "src/modules/houses/entities/house.entity";
import { CreateFloorDto } from "./dto/create-floor.dto";
import { FloorResponseDto } from "./dto/response-floor.dto";
import { ListFloorQueryDto } from "./dto/ListFloorQuery.dto";
import { UpdateFloorDto } from "./dto/update-floor.dto";
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
export class FloorService {
    constructor(
        @InjectRepository(Floor)
        private floorRepository: Repository<Floor>,
        @InjectRepository(House)
        private houseRepository: Repository<House>,
    ) {}

    private ensureActor(actor?: Actor): Actor {
        // Every read/write path must have auth context from JwtAuthGuard.
        if (!actor?.sub || !actor?.role) {
            throw new ForbiddenException('Missing auth actor');
        }

        return actor;
    }

    private applyReadScope(qb: SelectQueryBuilder<Floor>, actor: Actor) {
        // Admin can read all floors.
        if (actor.role === 'admin') {
            return qb;
        }

        // Landlord can read only floors that belong to their own houses.
        if (actor.role === 'landlord') {
            return qb
                .innerJoin('floor.house', 'scope_house')
                .andWhere('scope_house.landlord_id = :actorId', {
                    actorId: actor.sub,
                });
        }

            // Unknown roles should never see data.
        return qb.andWhere('1 = 0');
    }

    private async assertHouseWritableByActor(
        houseId: string,
        actor: Actor,
    ): Promise<void> {
        // Create/update operations should verify ownership of target house.
        if (actor.role === 'admin') {
            const houseExists = await this.houseRepository.exist({
                where: { id: houseId },
            });

            if (!houseExists) {
                throw new BadRequestException('Invalid house_id');
            }
            return;
        }

        if (actor.role !== 'landlord') {
            throw new ForbiddenException('No permission for this house');
        }

        const house = await this.houseRepository.findOne({
            where: { id: houseId, landlord_id: actor.sub },
            select: ['id'],
        });

        if (!house) {
            throw new BadRequestException('Invalid house_id');
        }
    }

    private async assertFloorWritableByActor(
        floorId: string,
        actor: Actor,
    ): Promise<Floor> {
        // Update/delete operations should verify ownership of target floor.
        if (actor.role === 'admin') {
            const floor = await this.floorRepository.findOne({
                where: { id: floorId },
            });
            if (!floor) {
                throw new NotFoundException('Floor not found');
            }
            return floor;
        }

        if (actor.role !== 'landlord') {
            throw new ForbiddenException('Only landlord can modify floor');
        }

        const floor = await this.floorRepository
            .createQueryBuilder('floor')
            .innerJoin('floor.house', 'house')
            .where('floor.id = :floorId', { floorId })
            .andWhere('house.landlord_id = :actorId', { actorId: actor.sub })
            .getOne();

        if (!floor) {
            throw new NotFoundException('Floor not found');
        }

        return floor;
    }

    private resolveSummaryParams(query?: ListFloorQueryDto): SummaryParams {
        // Step 1: Normalize input from client.
        // If a field is missing, use safe defaults so query behavior is predictable.
        const page = query?.page || 1;
        const limit = query?.limit || 10;
        const search = query?.search?.trim();
        const sortBy = query?.sortBy ?? 'created_at';
        const sortOrder = query?.sortOrder ?? 'DESC';

        // Step 2: Whitelist sort columns to avoid arbitrary SQL column injection.
        // Client sortBy value is mapped to known SQL expressions only.
        const sortMap = {
            floor_no: 'floor.floor_no',
            created_at: 'floor.created_at',
        };

        const sortColumn = sortMap[sortBy] ?? 'floor.created_at';

        return {
            page,
            limit,
            search,
            sortColumn,
            sortOrder,
        };
    }

    private buildSummaryQuery(houseId?: string, query?: ListFloorQueryDto) {
        const params = this.resolveSummaryParams(query);

        // Query flow overview:
        // 1) build base SELECT + aggregate columns
        // 2) apply optional house filter
        // 3) apply optional search filter
        // 4) apply sort + paging
        // 5) role scope is applied later in findAllSummary/findByHouseSummary
        const qb = this.buildSummaryBaseQuery();

        this.applyHouseFilter(qb, houseId);
        this.applySearchFilter(qb, params.search);
        this.applySortAndPaging(qb, params);

        return qb;
    }

    private buildSummaryBaseQuery() {
        // Base query returns one row per floor and a room count for that floor.
        // COUNT(*) OVER() gives total rows before pagination, useful for UI meta.
        return this.floorRepository
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
    }

    private applyHouseFilter(qb: SelectQueryBuilder<Floor>, houseId?: string){
        // Narrow result to a single house when endpoint asks /floors/house/:house_id.
        // This filter is business-level filter; role scope is applied separately.
        if (houseId) {
            qb.where('floor.house_id = :houseId', { houseId });
        }
    }

    private applySearchFilter(qb: SelectQueryBuilder<Floor>, search?: string) {
        // Search runs only when user provides keyword.
        // floor_no is numeric, so cast to text to support ILIKE search.
        if (search) {
            qb.andWhere(
                new Brackets((searchQb) => {
                    searchQb.where('CAST(floor.floor_no AS TEXT) ILIKE :search');
                }),
                { search: `%${search}%` },
            );
        }
    }

    private applySortAndPaging(qb: SelectQueryBuilder<Floor>, params: SummaryParams) {
        // Apply stable ordering before paging.
        // offset = (page - 1) * limit is standard page-to-offset conversion.
        qb.orderBy(params.sortColumn, params.sortOrder);
        qb.offset((params.page - 1) * params.limit);
        qb.limit(params.limit);
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

    async findAllSummary(query: ListFloorQueryDto, actor?: Actor) {
        // Always apply role scope before executing any read query.
        const resolvedActor = this.ensureActor(actor);
        const page = query?.page || 1;
        const limit = query?.limit || 10;

        const qb = this.buildSummaryQuery(undefined, query);
        this.applyReadScope(qb, resolvedActor);

        // Execute query after all filters/scope were attached.
        const rows = await qb.getRawMany();
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

    async findByHouseSummary(
        houseId: string,
        query: ListFloorQueryDto,
        actor?: Actor,
    ) {
        // House-specific listing still needs role scope to prevent horizontal access.
        const resolvedActor = this.ensureActor(actor);
        const page = query?.page || 1;
        const limit = query?.limit || 10;

        const qb = this.buildSummaryQuery(houseId, query);
        this.applyReadScope(qb, resolvedActor);

        // Same pipeline as findAllSummary, but with extra house filter.
        const rows = await qb.getRawMany();
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

    async findOne(id: string, actor?: Actor): Promise<{data: FloorResponseDto[]}> {
        // Detail endpoint is protected by the same read scope as list endpoints.
        const resolvedActor = this.ensureActor(actor);

        const qb = this.floorRepository
            .createQueryBuilder('floor')
            .leftJoinAndSelect('floor.rooms', 'rooms')
            .where('floor.id = :id', { id });

        this.applyReadScope(qb, resolvedActor);

        const floor = await qb.getOne();
        if (!floor) {
            throw new NotFoundException('Floor not found');
        }
        return { data: [this.toResponse(floor)] };
    }

    async create(data: CreateFloorDto, actor?: Actor): Promise<FloorResponseDto> {
        // For writes, validate actor and ownership before persistence.
        const resolvedActor = this.ensureActor(actor);
        await this.assertHouseWritableByActor(data.house_id, resolvedActor);

        const floor = this.floorRepository.create(data);
        const floorCreateSaved = await this.floorRepository.save(floor);
        return this.toResponse(floorCreateSaved);
    }

    async update(id: string, data: UpdateFloorDto, actor?: Actor): Promise<FloorResponseDto> {
        // 1) Ensure actor can modify this floor.
        // 2) Ensure next house_id (if changed) is also writable by actor.
        const resolvedActor = this.ensureActor(actor);
        const floor = await this.assertFloorWritableByActor(id, resolvedActor);

        const nextHouseId = data.house_id ?? floor.house_id;
        await this.assertHouseWritableByActor(nextHouseId, resolvedActor);

        const updateFloor = this.floorRepository.merge(floor, data);
        const updateFloorSaved = await this.floorRepository.save(updateFloor);
        return this.toResponse(updateFloorSaved);
    }

    async delete(id: string, actor?: Actor): Promise<{ message: string; id: string }> {
        // Remove only after ownership check to avoid cross-tenant deletes.
        const resolvedActor = this.ensureActor(actor);
        const floor = await this.assertFloorWritableByActor(id, resolvedActor);
        await this.floorRepository.remove(floor);

        return {
            message: 'Floor deleted successfully',
            id,
        }
    }
}