// src/modules/intervention/intervention.module.ts
import { Module } from '@nestjs/common';
import { InterventionService } from './intervention.service';
@Module({ providers: [InterventionService], exports: [InterventionService] })
export class InterventionModule {}