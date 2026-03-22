export class FloorRoomResponseDto {
    id: string;
    floor_id: string;
    name: string;
    price: number;
    capacity: number;
    status: string;
}

export class FloorResponseDto {
    id: string;
    house_id: string;
    floor_no: number;
    // name: string;
    rooms: FloorRoomResponseDto[];
}