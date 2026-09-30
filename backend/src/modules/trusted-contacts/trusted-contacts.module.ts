// src/modules/trusted-contacts/trusted-contacts.module.ts
import { Module } from '@nestjs/common';
import { TrustedContactsController } from './trusted-contacts.controller';
@Module({ controllers: [TrustedContactsController] })
export class TrustedContactsModule {}