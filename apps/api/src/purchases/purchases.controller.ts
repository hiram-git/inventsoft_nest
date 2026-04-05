import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PurchasesService } from './purchases.service';

@ApiTags('purchases')
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Get('health')
  health(): { status: string } {
    return this.purchasesService.health();
  }
}
