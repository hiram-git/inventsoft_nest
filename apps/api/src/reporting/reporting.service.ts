import { Injectable } from '@nestjs/common';

@Injectable()
export class ReportingService {
  health(): { status: string } {
    return { status: 'reporting context ok' };
  }
}
