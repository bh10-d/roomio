import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNotEmpty, IsNumber, IsString, IsUUID, Min } from 'class-validator';

export class CreateBillDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  room_id: string;

  @ApiProperty({ example: '2026-03-01' })
  @IsDateString()
  month: string;

  @ApiProperty({ example: 7200000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  total_amount: number;

  @ApiProperty({ example: 'pending' })
  @IsString()
  @IsNotEmpty()
  status: string;
}
