import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateRoomDto {
    // @ApiProperty({ format: 'uuid' })
    // @IsUUID()
    // house_id: string;

    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    floor_id: string;

    @ApiProperty({ example: 'Room 101' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 3500000 })
    @Type(() => Number)
    @IsInt()
    @Min(0)
    price: number;

    @ApiProperty({ example: 2 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    capacity: number;

    @ApiPropertyOptional({ example: 'available' })
    @IsString()
    @IsOptional()
    status?: string;
}
