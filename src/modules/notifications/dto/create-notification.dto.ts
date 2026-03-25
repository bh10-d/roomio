import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateNotificationDto {
    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    user_id: string;

    @ApiProperty({ example: 'Payment Reminder' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ example: 'Your bill for March is due in 3 days.' })
    @IsString()
    @IsNotEmpty()
    content: string;

    @ApiProperty({ example: false })
    @IsBoolean()
    is_read: boolean;

    @ApiProperty({ example: 'billing' })
    @IsString()
    @IsNotEmpty()
    type: string;
}