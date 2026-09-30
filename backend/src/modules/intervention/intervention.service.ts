// src/modules/intervention/intervention.service.ts
import { Injectable } from '@nestjs/common';
import { DetectedSignal } from '../signal-analysis/types';
import { InterventionAction, RiskLevel, ScamType } from '@prisma/client';

export interface InterventionResult {
  action: InterventionAction;
  riskLevel: RiskLevel;
  scamType: ScamType;
  headline: string;
  reasons: { code: string; label: string }[];
  doNotDo: string[];
  safestNext: string[];
  verifyVia: string[];
  uncertainty?: string;
  scoringVersion: string;
}

@Injectable()
export class InterventionService {
  readonly version = 'intervention-1.0.0';

  buildIntervention(signals: DetectedSignal[], channel: string): InterventionResult {
    const score = this.aggregate(signals);
    const riskLevel = this.toRiskLevel(score);
    const scamType = this.classifyScamType(signals);
    const action = this.toAction(riskLevel, signals);

    return {
      action,
      riskLevel,
      scamType,
      headline: this.headline(scamType, riskLevel),
      reasons: signals.map(s => ({ code: s.code, label: s.label })),
      doNotDo: this.doNotDo(scamType, channel),
      safestNext: this.safestNext(scamType, channel, riskLevel),
      verifyVia: this.verifyVia(scamType),
      uncertainty: this.uncertainty(signals, score),
      scoringVersion: this.version,
    };
  }

  private aggregate(signals: DetectedSignal[]): number {
    if (!signals.length) return 0;
    // weighted-confidence sum, capped at 1
    const sum = signals.reduce((a, s) => a + s.weight * s.confidence, 0);
    return Math.max(0, Math.min(1, sum / 1.5));
  }

  private toRiskLevel(score: number): RiskLevel {
    if (score >= 0.75) return 'CRITICAL';
    if (score >= 0.5)  return 'HIGH';
    if (score >= 0.25) return 'MEDIUM';
    return 'LOW';
  }

  private toAction(level: RiskLevel, signals: DetectedSignal[]): InterventionAction {
    const hasPaymentSignal = signals.some(s => ['HIGH_AMOUNT', 'NEW_BENEFICIARY', 'UNUSUAL_CURRENCY'].includes(s.code));
    if (level === 'CRITICAL') return 'ESCALATE_TRUSTED_CONTACT';
    if (level === 'HIGH' && hasPaymentSignal) return 'REQUIRE_OFFLINE_VERIFICATION';
    if (level === 'HIGH') return 'STRONG_WARN';
    if (level === 'MEDIUM') return 'WARN';
    return 'EXPLAIN';
  }

  private classifyScamType(signals: DetectedSignal[]): ScamType {
    const codes = new Set(signals.map(s => s.code));
    if (codes.has('BRAND_DOMAIN_MISMATCH')) return 'BANK_IMPERSONATION';
    if (codes.has('AUTHORITY_PRESSURE'))    return 'GOVERNMENT_IMPERSONATION';
    if (codes.has('NEW_BENEFICIARY') || codes.has('HIGH_AMOUNT')) return 'PAYMENT_DIVERSION';
    if (codes.has('UNUSUAL_CURRENCY'))      return 'CRYPTO_TRANSFER';
    if (codes.has('TOLLFREE_CALLER'))       return 'BANK_IMPERSONATION';
    if (codes.has('LOOKALIKE_DOMAIN') || codes.has('SUSPICIOUS_TLD')) return 'KYC_PHISHING';
    return 'UNKNOWN';
  }

  private headline(t: ScamType, r: RiskLevel): string {
    const map: Record<ScamType, string> = {
      BANK_IMPERSONATION: 'Possible bank impersonation',
      GOVERNMENT_IMPERSONATION: 'Possible government impersonation',
      TECH_SUPPORT: 'Possible tech-support scam',
      PARCEL_DELIVERY: 'Possible parcel-delivery scam',
      KYC_PHISHING: 'Possible phishing / credential harvesting',
      ROMANCE: 'Possible romance scam pattern',
      INVESTMENT: 'Possible investment scam',
      CRYPTO_TRANSFER: 'Crypto transfer pressure detected',
      PAYMENT_DIVERSION: 'Abnormal payment request',
      OTP_HARVESTING: 'Possible OTP harvesting',
      FAKE_INVOICE: 'Possible fake invoice',
      REMOTE_ACCESS: 'Possible remote-access scam',
      UNKNOWN: 'Suspicious content detected',
    };
    return `${r === 'CRITICAL' ? '⚠️ ' : ''}${map[t]}`;
  }

  private doNotDo(t: ScamType, channel: string): string[] {
    const base = ['Do not click any links in this message.', 'Do not share OTPs, passwords, or PINs.'];
    if (channel === 'CALL') base.push('Do not transfer money during this call.', 'Do not install any app the caller asks you to install.');
    if (t === 'PAYMENT_DIVERSION' || t === 'FAKE_INVOICE') base.push('Do not send the payment until you verify offline.');
    if (t === 'CRYPTO_TRANSFER') base.push('Do not send crypto. Crypto payments cannot be reversed.');
    return base;
  }

  private safestNext(t: ScamType, channel: string, r: RiskLevel): string[] {
    const out = ['Stop and take a breath. Real institutions never penalize you for verifying.'];
    if (channel === 'CALL') out.push('End the call. Then call the number on the back of your card or the official website.');
    if (channel === 'SMS' || channel === 'EMAIL' || channel === 'MESSAGING') out.push('Do not reply. Open the official app or website yourself, not via the link.');
    if (t === 'PAYMENT_DIVERSION') out.push('Confirm beneficiary details with the recipient using a known phone number.');
    if (r === 'CRITICAL' || r === 'HIGH') out.push('Consider alerting a trusted family contact before taking action.');
    return out;
  }

  private verifyVia(t: ScamType): string[] {
    if (t === 'BANK_IMPERSONATION') return ['Number on the back of your bank card', 'Official mobile banking app'];
    if (t === 'GOVERNMENT_IMPERSONATION') return ['Government website typed manually', 'Official phone number from your last paper letter'];
    return ['Official website you typed yourself', 'Customer support via official app'];
  }

  private uncertainty(signals: DetectedSignal[], score: number): string | undefined {
    if (signals.length === 0) return 'No strong signals detected. We may have missed context — when in doubt, verify offline.';
    const avgConf = signals.reduce((a, s) => a + s.confidence, 0) / signals.length;
    if (avgConf < 0.6) return 'Confidence is moderate. Treat this as a caution, not a verdict, and verify through official channels.';
    if (score > 0.4 && score < 0.6) return 'Score sits near a decision boundary. We err on the side of warning you.';
    return undefined;
  }
}