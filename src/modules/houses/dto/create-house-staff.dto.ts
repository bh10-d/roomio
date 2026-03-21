import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateHouseStaffDto {
    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    @IsNotEmpty()
    user_id: string;

    @ApiProperty({ example: 'manager' })
    @IsString()
    @IsNotEmpty()
    role: string;
}