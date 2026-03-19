import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNotEmpty, IsNumber, IsString, IsUUID, Min } from 'class-validator';

export class CreateContractDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  room_id: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenant_id: string;

  @ApiProperty({ example: '2026-03-01' })
  @IsDateString()
  start_date: string;

  @ApiProperty({ example: '2027-03-01' })
  @IsDateString()
  end_date: string;

  @ApiProperty({ example: 'active' })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiProperty({ example: 5000000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  deposit_amount: number;
}
