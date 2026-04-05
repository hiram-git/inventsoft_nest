import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReportingService } from './reporting.service';

@ApiTags('reporting')
@Controller('reporting')
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('health')
  health(): { status: string } {
    return this.reportingService.health();
  }
}
