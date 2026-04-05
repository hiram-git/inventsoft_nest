import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PurchaseOrderService } from './purchase-order.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { ReceivePurchaseOrderDto } from './dto/receive-purchase-order.dto';

@ApiTags('purchase-orders')
@Controller('purchase-orders')
export class PurchaseOrderController {
  constructor(private readonly poService: PurchaseOrderService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas las órdenes de compra' })
  findAll() {
    return this.poService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener orden de compra por ID' })
  findOne(@Param('id') id: string) {
    return this.poService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear orden de compra (estado DRAFT)' })
  @ApiResponse({ status: 201, description: 'OC creada en estado DRAFT' })
  create(@Body() dto: CreatePurchaseOrderDto) {
    return this.poService.create(dto);
  }

  @Patch(':id/submit')
  @ApiOperation({ summary: 'Enviar OC para aprobación (DRAFT → SUBMITTED)' })
  submit(@Param('id') id: string) {
    return this.poService.submit(id);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Aprobar OC (SUBMITTED → APPROVED)' })
  approve(@Param('id') id: string) {
    return this.poService.approve(id);
  }

  @Patch(':id/receive')
  @ApiOperation({ summary: 'Recibir mercancía — actualiza stock automáticamente (APPROVED → RECEIVED)' })
  receive(@Param('id') id: string, @Body() dto: ReceivePurchaseOrderDto) {
    return this.poService.receive(id, dto);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar OC' })
  cancel(@Param('id') id: string) {
    return this.poService.cancel(id);
  }
}
