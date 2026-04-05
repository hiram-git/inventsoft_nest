import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { StockService } from './stock.service';
import { ReceiveStockDto } from './dto/receive-stock.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';

@ApiTags('stock')
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  @ApiOperation({ summary: 'Stock actual por producto y almacén' })
  @ApiQuery({ name: 'warehouseId', required: false })
  getCurrentStock(@Query('warehouseId') warehouseId?: string) {
    return this.stockService.getCurrentStock(warehouseId);
  }

  @Get('movements')
  @ApiOperation({ summary: 'Historial de movimientos de inventario' })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'warehouseId', required: false })
  getMovements(
    @Query('productId') productId?: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.stockService.getMovements(productId, warehouseId);
  }

  @Post('receive')
  @ApiOperation({ summary: 'Ingresar mercancía (transacción ACID)' })
  receiveStock(@Body() dto: ReceiveStockDto) {
    return this.stockService.receiveStock(dto);
  }

  @Post('adjust')
  @ApiOperation({ summary: 'Ajuste manual de stock' })
  adjustStock(@Body() dto: AdjustStockDto) {
    return this.stockService.adjustStock(dto);
  }
}
