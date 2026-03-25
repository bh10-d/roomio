export class NotificationUserSummaryDto {
    id: string;
    name: string;
    phone: string;
    email: string;
}

export class NotificationResponseDto {
    id: string;
    user_id: string;
    title: string;
    content: string;
    is_read: boolean;
    created_at: Date;
    type: string;
    user: NotificationUserSummaryDto;
}