import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@inventsoft/infrastructure';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException(`Producto ${id} no encontrado`);
    return product;
  }

  async create(dto: CreateProductDto) {
    const existing = await this.prisma.product.findUnique({
      where: { sku: dto.sku },
    });
    if (existing) {
      throw new ConflictException(`Ya existe un producto con SKU "${dto.sku}"`);
    }

    return this.prisma.product.create({
      data: {
        sku: dto.sku,
        name: dto.name,
        description: dto.description ?? '',
        unitCost: dto.unitCost,
        unitPrice: dto.unitPrice,
      },
    });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
