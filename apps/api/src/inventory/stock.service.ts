import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@inventsoft/infrastructure';
import { StockMovementType } from '@prisma/client';
import { ReceiveStockDto } from './dto/receive-stock.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';

@Injectable()
export class StockService {
  private readonly logger = new Logger(StockService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Stock actual por almacén — agrupado por producto
  async getCurrentStock(warehouseId?: string) {
    return this.prisma.stockItem.findMany({
      where: {
        ...(warehouseId ? { warehouseId } : {}),
        quantity: { gt: 0 },
      },
      include: {
        product: { select: { id: true, sku: true, name: true } },
        warehouse: { select: { id: true, name: true } },
      },
      orderBy: [{ warehouse: { name: 'asc' } }, { product: { name: 'asc' } }],
    });
  }

  // Historial de movimientos
  async getMovements(productId?: string, warehouseId?: string) {
    return this.prisma.stockMovement.findMany({
      where: {
        ...(productId ? { productId } : {}),
        ...(warehouseId ? { warehouseId } : {}),
      },
      include: {
        product: { select: { id: true, sku: true, name: true } },
        warehouse: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  // Ingreso de mercancía — transacción ACID con optimistic locking
  async receiveStock(dto: ReceiveStockDto, userId?: string) {
    await this.validateProductAndWarehouse(dto.productId, dto.warehouseId);

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.stockItem.findUnique({
        where: {
          productId_warehouseId: {
            productId: dto.productId,
            warehouseId: dto.warehouseId,
          },
        },
      });

      if (existing) {
        // Optimistic lock: actualiza solo si la versión no cambió
        const updated = await tx.stockItem.updateMany({
          where: {
            productId: dto.productId,
            warehouseId: dto.warehouseId,
            version: existing.version,
          },
          data: {
            quantity: { increment: dto.quantity },
            version: { increment: 1 },
          },
        });

        if (updated.count === 0) {
          throw new BadRequestException(
            'Conflicto de concurrencia al actualizar stock. Reintenta la operación.',
          );
        }
      } else {
        await tx.stockItem.create({
          data: {
            productId: dto.productId,
            warehouseId: dto.warehouseId,
            quantity: dto.quantity,
            version: 1,
          },
        });
      }

      const movement = await tx.stockMovement.create({
        data: {
          type: StockMovementType.IN,
          productId: dto.productId,
          warehouseId: dto.warehouseId,
          quantity: dto.quantity,
          reference: dto.reference,
          notes: dto.notes,
          createdBy: userId,
        },
        include: {
          product: { select: { sku: true, name: true } },
          warehouse: { select: { name: true } },
        },
      });

      this.logger.log(
        `Stock IN: ${movement.product.sku} +${dto.quantity} → ${movement.warehouse.name}`,
      );
      return movement;
    });
  }

  // Ajuste manual de stock (positivo o negativo)
  async adjustStock(dto: AdjustStockDto, userId?: string) {
    await this.validateProductAndWarehouse(dto.productId, dto.warehouseId);

    return this.prisma.$transaction(async (tx) => {
      const stockItem = await tx.stockItem.findUnique({
        where: {
          productId_warehouseId: {
            productId: dto.productId,
            warehouseId: dto.warehouseId,
          },
        },
      });

      const currentQty = stockItem?.quantity ?? 0;
      const newQty = currentQty + dto.delta;

      if (newQty < 0) {
        throw new BadRequestException(
          `Stock insuficiente. Actual: ${currentQty}, ajuste: ${dto.delta}`,
        );
      }

      if (stockItem) {
        await tx.stockItem.updateMany({
          where: {
            productId: dto.productId,
            warehouseId: dto.warehouseId,
            version: stockItem.version,
          },
          data: { quantity: newQty, version: { increment: 1 } },
        });
      } else {
        await tx.stockItem.create({
          data: {
            productId: dto.productId,
            warehouseId: dto.warehouseId,
            quantity: newQty,
            version: 1,
          },
        });
      }

      const movement = await tx.stockMovement.create({
        data: {
          type: StockMovementType.ADJUSTMENT,
          productId: dto.productId,
          warehouseId: dto.warehouseId,
          quantity: Math.abs(dto.delta),
          notes: `${dto.delta > 0 ? '+' : ''}${dto.delta} | ${dto.notes}`,
          createdBy: userId,
        },
      });

      return { movement, newQuantity: newQty };
    });
  }

  private async validateProductAndWarehouse(productId: string, warehouseId: string) {
    const [product, warehouse] = await Promise.all([
      this.prisma.product.findUnique({ where: { id: productId } }),
      this.prisma.warehouse.findUnique({ where: { id: warehouseId } }),
    ]);
    if (!product) throw new NotFoundException(`Producto ${productId} no encontrado`);
    if (!warehouse) throw new NotFoundException(`Almacén ${warehouseId} no encontrado`);
  }
}
