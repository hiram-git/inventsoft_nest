import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@inventsoft/infrastructure';
import { CreateSupplierDto } from './dto/create-supplier.dto';

@Injectable()
export class SupplierService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.supplier.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id } });
    if (!supplier) throw new NotFoundException(`Proveedor ${id} no encontrado`);
    return supplier;
  }

  async create(dto: CreateSupplierDto) {
    const existing = await this.prisma.supplier.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException(`Ya existe un proveedor con email "${dto.email}"`);

    return this.prisma.supplier.create({
      data: { name: dto.name, email: dto.email, phone: dto.phone, address: dto.address },
    });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.supplier.update({ where: { id }, data: { isActive: false } });
  }
}
