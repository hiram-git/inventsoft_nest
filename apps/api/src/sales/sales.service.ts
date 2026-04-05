import { Injectable } from '@nestjs/common';

@Injectable()
export class SalesService {
  health(): { status: string } {
    return { status: 'sales context ok' };
  }
}
