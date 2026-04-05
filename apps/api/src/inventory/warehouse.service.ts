import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@inventsoft/infrastructure';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';

@Injectable()
export class WarehouseService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.warehouse.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const warehouse = await this.prisma.warehouse.findUnique({ where: { id } });
    if (!warehouse) throw new NotFoundException(`Almacén ${id} no encontrado`);
    return warehouse;
  }

  async create(dto: CreateWarehouseDto) {
    return this.prisma.warehouse.create({
      data: {
        name: dto.name,
        location: dto.location,
        description: dto.description,
      },
    });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.warehouse.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
