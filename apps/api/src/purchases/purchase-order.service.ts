import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@inventsoft/infrastructure';
import { PurchaseOrderStatus, StockMovementType } from '@prisma/client';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { ReceivePurchaseOrderDto } from './dto/receive-purchase-order.dto';

@Injectable()
export class PurchaseOrderService {
  private readonly logger = new Logger(PurchaseOrderService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Consultas ──────────────────────────────────────────────────────────────

  findAll() {
    return this.prisma.purchaseOrder.findMany({
      include: {
        supplier: { select: { id: true, name: true } },
        warehouse: { select: { id: true, name: true } },
        items: {
          include: { product: { select: { id: true, sku: true, name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        warehouse: { select: { id: true, name: true } },
        items: {
          include: { product: { select: { id: true, sku: true, name: true } } },
        },
      },
    });
    if (!po) throw new NotFoundException(`Orden de compra ${id} no encontrada`);
    return po;
  }

  // ─── Crear OC ────────────────────────────────────────────────────────────────

  async create(dto: CreatePurchaseOrderDto, userId?: string) {
    // Validar proveedor
    const supplier = await this.prisma.supplier.findUnique({ where: { id: dto.supplierId } });
    if (!supplier) throw new NotFoundException(`Proveedor ${dto.supplierId} no encontrado`);

    // Validar que los productos existan
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true },
    });
    if (products.length !== productIds.length) {
      throw new NotFoundException('Uno o más productos no existen');
    }

    // Calcular total
    const totalAmount = dto.items.reduce(
      (sum, item) => sum + item.quantity * item.unitCost,
      0,
    );

    return this.prisma.purchaseOrder.create({
      data: {
        supplierId: dto.supplierId,
        warehouseId: dto.warehouseId,
        totalAmount,
        notes: dto.notes,
        createdBy: userId,
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitCost: item.unitCost,
          })),
        },
      },
      include: {
        supplier: { select: { id: true, name: true } },
        items: {
          include: { product: { select: { sku: true, name: true } } },
        },
      },
    });
  }

  // ─── Transiciones de estado ──────────────────────────────────────────────────

  async submit(id: string) {
    const po = await this.findOne(id);
    this.assertStatus(po.status, PurchaseOrderStatus.DRAFT, 'enviar');
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: PurchaseOrderStatus.SUBMITTED, submittedAt: new Date() },
    });
  }

  async approve(id: string) {
    const po = await this.findOne(id);
    this.assertStatus(po.status, PurchaseOrderStatus.SUBMITTED, 'aprobar');
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: PurchaseOrderStatus.APPROVED, approvedAt: new Date() },
    });
  }

  async cancel(id: string) {
    const po = await this.findOne(id);
    if (po.status === PurchaseOrderStatus.RECEIVED) {
      throw new BadRequestException('No se puede cancelar una orden ya recibida');
    }
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: PurchaseOrderStatus.CANCELLED },
    });
  }

  // ─── Recibir mercancía (transacción ACID) ────────────────────────────────────

  async receive(id: string, dto: ReceivePurchaseOrderDto, userId?: string) {
    const po = await this.findOne(id);
    this.assertStatus(po.status, PurchaseOrderStatus.APPROVED, 'recibir');

    const warehouseId = dto.warehouseId ?? po.warehouseId;
    if (!warehouseId) {
      throw new BadRequestException('Debes especificar el almacén destino');
    }

    const warehouse = await this.prisma.warehouse.findUnique({ where: { id: warehouseId } });
    if (!warehouse) throw new NotFoundException(`Almacén ${warehouseId} no encontrado`);

    return this.prisma.$transaction(async (tx) => {
      // Para cada ítem: actualizar StockItem + crear StockMovement
      for (const item of po.items) {
        const existing = await tx.stockItem.findUnique({
          where: {
            productId_warehouseId: { productId: item.productId, warehouseId },
          },
        });

        if (existing) {
          const updated = await tx.stockItem.updateMany({
            where: {
              productId: item.productId,
              warehouseId,
              version: existing.version, // optimistic lock
            },
            data: {
              quantity: { increment: item.quantity },
              version: { increment: 1 },
            },
          });
          if (updated.count === 0) {
            throw new BadRequestException(
              `Conflicto de concurrencia en producto ${item.product.sku}. Reintenta.`,
            );
          }
        } else {
          await tx.stockItem.create({
            data: {
              productId: item.productId,
              warehouseId,
              quantity: item.quantity,
              version: 1,
            },
          });
        }

        await tx.stockMovement.create({
          data: {
            type: StockMovementType.IN,
            productId: item.productId,
            warehouseId,
            quantity: item.quantity,
            reference: id, // ID de la OC como referencia
            notes: `Recepción OC | ${dto.notes ?? ''}`.trim(),
            createdBy: userId,
          },
        });
      }

      // Marcar OC como recibida
      const received = await tx.purchaseOrder.update({
        where: { id },
        data: {
          status: PurchaseOrderStatus.RECEIVED,
          warehouseId,
          receivedAt: new Date(),
        },
        include: {
          supplier: { select: { name: true } },
          warehouse: { select: { name: true } },
          items: { include: { product: { select: { sku: true, name: true } } } },
        },
      });

      this.logger.log(
        `OC recibida: ${id} | ${po.items.length} ítems → ${warehouse.name}`,
      );

      return received;
    });
  }

  // ─── Helper ──────────────────────────────────────────────────────────────────

  private assertStatus(
    current: PurchaseOrderStatus,
    required: PurchaseOrderStatus,
    action: string,
  ) {
    if (current !== required) {
      throw new BadRequestException(
        `No se puede ${action} una orden en estado "${current}". Se requiere estado "${required}".`,
      );
    }
  }
}
