export class Bill {}

export class RoomUser {}

export class Contract {}

export class RoomResponseDto {
    id: string;
    floor_id: string;
    name: string;
    price: number;
    capacity: number;
    status: string;
    bills: Bill[];
    roomUsers: RoomUser[];
    contracts: Contract[];
}