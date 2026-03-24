export class RoomSummaryDto {
    id: string;
    floor_id: string;
    name: string;
    price: number;
    capacity: number;
    status: string;
}

export class TenantSummaryDto {
    id: string;
    name: string;
    email: string;
    phone: string;
}

export class ContractResponseDto {
    id: string;
    room_id: string;
    tenant_id: string;
    start_date: Date;
    end_date: Date;
    status: string;
    deposit_amount: number;
    created_at: Date;
    updated_at: Date;
    room: RoomSummaryDto;
    tenant: TenantSummaryDto; // sau nay chinh lai la mang vi phong co nhieu tenant
}