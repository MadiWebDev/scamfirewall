// src/modules/signal-analysis/signal-analysis.module.ts
import { Module } from '@nestjs/common';
import { SignalAnalysisService } from './signal-analysis.service';
@Module({ providers: [SignalAnalysisService], exports: [SignalAnalysisService] })
export class SignalAnalysisModule {}