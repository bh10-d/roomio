export class MaintenanceRoomSummaryDto {
    id: string;
    floor_id: string;
    name: string;
}

export class MaintenanceTenantSummaryDto {
    id: string;
    name: string;
    phone: string;
    email: string;
}

export class MaintenanceResponseDto {
    id: string;
    room_id: string;
    tenant_id: string;
    title: string;
    description: string;
    status: string;
    created_at: Date;
    updated_at: Date;
    room: MaintenanceRoomSummaryDto;
    tenant: MaintenanceTenantSummaryDto;
}