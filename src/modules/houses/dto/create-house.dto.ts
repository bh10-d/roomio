import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateHouseDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  landlord_id: string;

  @ApiProperty({ example: 'Sunrise Building' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '123 Nguyen Trai, District 1, HCMC' })
  @IsString()
  @IsNotEmpty()
  address: string;
}
