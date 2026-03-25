import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNotEmpty, IsNumber, IsString, IsUUID, Min } from 'class-validator';

export class CreateMeterDto {
    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    room_id: string;

    @ApiProperty({ example: 'electricity' })
    @IsString()
    @IsNotEmpty()
    type: string;

    @ApiProperty({ example: 120 })
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    previous_reading: number;

    @ApiProperty({ example: 150 })
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    current_reading: number;

    @ApiProperty({ example: '2026-03-01' })
    @IsDateString()
    month: string;
}