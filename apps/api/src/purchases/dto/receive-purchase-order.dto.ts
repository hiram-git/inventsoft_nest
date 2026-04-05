import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class ReceivePurchaseOrderDto {
  @ApiProperty({ example: 'clxxx...', description: 'Almacén donde se recibe la mercancía' })
  @IsString()
  @IsNotEmpty()
  warehouseId: string;

  @ApiPropertyOptional({ example: 'Recibido completo, revisado sin daños' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
