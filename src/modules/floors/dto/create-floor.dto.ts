import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';

export class CreateFloorDto {
    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    house_id: string;

    @ApiProperty({ example: 1 })
    @IsNumber()
    floor_no: number;

    // @ApiProperty({ example: 'Sunrise Floor 1' })
    // @IsString()
    // // @IsNotEmpty()
    // name: string;
}
