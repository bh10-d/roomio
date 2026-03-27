import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { UserStatus } from 'src/common/enums/user-status.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'Nguyen Van A' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '0912345678' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'vana@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'tenant' })
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiProperty({ example: 'StrongPassword123!' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    enum: UserStatus,
    required: false,
    example: UserStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
