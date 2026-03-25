export class BillRoomSummaryDto {
    id: string;
    floor_id: string;
    name: string;
}

export class BillItemSummaryDto {
    id: string;
    bill_id: string;
    type: string;
    amount: number;
    unit_price: number;
    quantity: number;
    created_at: Date;
    updated_at: Date;
}

export class PaymentSummaryDto {
    id: number;
    bill_id: string;
    amount: number;
    payment_date: Date;
    method: string;
    status: string;
    created_at: Date;
    updated_at: Date;
}

export class BillResponseDto {
    id: string;
    room_id: string;
    month: Date;
    total_amount: number;
    status: string;
    created_at: Date;
    updated_at: Date;
    room: BillRoomSummaryDto | null;
    billItems: BillItemSummaryDto[];
    payments: PaymentSummaryDto[];
}