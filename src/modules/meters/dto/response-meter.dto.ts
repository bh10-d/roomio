export class MeterRoomSummaryDto {
    id: string;
    floor_id: string;
    name: string;
}

export class MeterResponseDto {
    id: string;
    room_id: string;
    type: string;
    previous_reading: number;
    current_reading: number;
    month: Date;
    room: MeterRoomSummaryDto;
}