import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, IsOptional, MaxLength } from 'class-validator';

export class CreateSupplierDto {
  @ApiProperty({ example: 'Distribuidora Electrónica S.A.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'contacto@distribuidora.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+57 300 123 4567' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ example: 'Calle 10 #45-20, Bogotá' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;
}
