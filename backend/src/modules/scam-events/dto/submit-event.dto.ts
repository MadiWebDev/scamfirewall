// src/modules/scam-events/dto/submit-event.dto.ts
import { IsEnum, IsNumber, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { EventChannel } from '@prisma/client';

export class SubmitEventDto {
  @IsEnum(EventChannel) channel!: EventChannel;
  @IsOptional() @IsString() @MaxLength(8000) text?: string;
  @IsOptional() @IsString() @MaxLength(2048) url?: string;
  @IsOptional() @IsString() @MaxLength(64)   callerId?: string;
  @IsOptional() @IsObject() invoice?: { amount?: number; currency?: string; beneficiary?: string; iban?: string };
}

export class FeedbackDto {
  helpful!: boolean;
  @IsOptional() correct?: boolean;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
}