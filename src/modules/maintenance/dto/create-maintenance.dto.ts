import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateMaintenanceDto {
    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    room_id: string;

    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    tenant_id: string;

    @ApiProperty({ example: 'Leaking sink' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ example: 'The sink in room A101 is leaking at night.' })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiProperty({ example: 'pending' })
    @IsString()
    @IsNotEmpty()
    status: string;
}