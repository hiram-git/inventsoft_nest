import { Module } from '@nestjs/common';
import { WarehouseController } from './warehouse.controller';
import { WarehouseService } from './warehouse.service';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';

@Module({
  controllers: [WarehouseController, ProductController, StockController],
  providers: [WarehouseService, ProductService, StockService],
  exports: [WarehouseService, ProductService, StockService],
})
export class InventoryModule {}
