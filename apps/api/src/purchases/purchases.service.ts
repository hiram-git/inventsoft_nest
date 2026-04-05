import { Injectable } from '@nestjs/common';

@Injectable()
export class PurchasesService {
  health(): { status: string } {
    return { status: 'purchases context ok' };
  }
}
