import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, IsPositive, IsOptional, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class ReceiveStockDto {
  @ApiProperty({ example: 'clxxx...', description: 'ID del producto' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 'clxxx...', description: 'ID del almacén' })
  @IsString()
  @IsNotEmpty()
  warehouseId: string;

  @ApiProperty({ example: 50, description: 'Cantidad a ingresar (debe ser positivo)' })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  quantity: number;

  @ApiPropertyOptional({ example: 'OC-2024-001', description: 'Referencia (orden de compra, etc.)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @ApiPropertyOptional({ example: 'Recepción inicial de inventario' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
