import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, IsNotEmpty as IsNE, IsOptional, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class AdjustStockDto {
  @ApiProperty({ example: 'clxxx...' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 'clxxx...' })
  @IsString()
  @IsNotEmpty()
  warehouseId: string;

  @ApiProperty({ example: -5, description: 'Delta de ajuste (positivo o negativo)' })
  @Type(() => Number)
  @IsInt()
  delta: number;

  @ApiProperty({ example: 'Corrección por conteo físico' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  notes: string;
}
