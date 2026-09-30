// src/modules/scam-events/scam-events.module.ts
import { Module } from '@nestjs/common';
import { ScamEventsService } from './scam-events.service';
import { ScamEventsController } from './scam-events.controller';
import { SignalAnalysisModule } from '../signal-analysis/signal-analysis.module';
import { InterventionModule } from '../intervention/intervention.module';

@Module({
  imports: [SignalAnalysisModule, InterventionModule],
  providers: [ScamEventsService],
  controllers: [ScamEventsController],
  exports: [ScamEventsService],
})
export class ScamEventsModule {}