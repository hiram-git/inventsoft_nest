import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';

@ApiTags('products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @ApiOperation({ summary: 'Listar productos activos' })
  findAll() {
    return this.productService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener producto por ID' })
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear nuevo producto' })
  create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desactivar producto' })
  deactivate(@Param('id') id: string) {
    return this.productService.deactivate(id);
  }
}
