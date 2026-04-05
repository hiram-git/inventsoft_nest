import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateWarehouseDto {
  @ApiProperty({ example: 'Almacén Central' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Zona Industrial, Calle 5 #12' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({ example: 'Almacén principal de operaciones' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
