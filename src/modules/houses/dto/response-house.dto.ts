export class HouseResponseDto {
    id: string;
    landlord_id: string;
    name: string;
    address: string;
}

export class HouseSummaryResponseDto {
    id: string;
    name: string;
    address: string;
    landlord_id: string;
    total_floors: number;
    total_rooms: number;
    available_rooms: number;
    occupied_rooms: number;
}

export class RoomLiteDto {
    id: string;
    name: string;
    price: number;
    capacity: number;
    status: string;
}

export class FloorTreeDto {
    id: string;
    floor_no: number;
    rooms: RoomLiteDto[];
}

export class HouseTreeResponseDto {
    id: string;
    name: string;
    address: string;
    landlord_id: string;
    floors: FloorTreeDto[];
}