import { Injectable } from '@nestjs/common';

@Injectable()
export class InventoryService {
  health(): { status: string } {
    return { status: 'inventory context ok' };
  }
}
