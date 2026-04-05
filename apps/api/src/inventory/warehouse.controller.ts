import { Controller, Get, Post, Delete, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WarehouseService } from './warehouse.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';

@ApiTags('warehouses')
@Controller('warehouses')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Get()
  @ApiOperation({ summary: 'Listar almacenes activos' })
  findAll() {
    return this.warehouseService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener almacén por ID' })
  findOne(@Param('id') id: string) {
    return this.warehouseService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear nuevo almacén' })
  @ApiResponse({ status: 201, description: 'Almacén creado exitosamente' })
  create(@Body() dto: CreateWarehouseDto) {
    return this.warehouseService.create(dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desactivar almacén' })
  deactivate(@Param('id') id: string) {
    return this.warehouseService.deactivate(id);
  }
}
