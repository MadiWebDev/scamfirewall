// src/modules/signal-analysis/detectors/payment-anomaly.detector.ts
import { SignalDetector, DetectorContext, DetectedSignal } from '../types';

export class PaymentAnomalyDetector implements SignalDetector {
  name = 'payment.detector';
  version = '1.0.0';

  async detect(ctx: DetectorContext): Promise<DetectedSignal[]> {
    if (!ctx.invoice) return [];
    const out: DetectedSignal[] = [];
    const { amount, currency, beneficiary } = ctx.invoice;

    if (amount && amount > 1000) {
      out.push(this.sig('HIGH_AMOUNT', 'High-value payment request', 'Amount is unusually high — verify carefully.', 0.4, 0.8, { amount, currency }));
    }
    if (currency && !['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'JPY'].includes(currency.toUpperCase())) {
      out.push(this.sig('UNUSUAL_CURRENCY', 'Unusual currency or asset', 'Crypto or rare-currency requests are common scam patterns.', 0.55, 0.75, { currency }));
    }
    const knownPayees = ctx.userHistory?.knownPayees ?? [];
    if (beneficiary && knownPayees.length > 0 && !knownPayees.some(p => p.toLowerCase() === beneficiary.toLowerCase())) {
      out.push(this.sig('NEW_BENEFICIARY', 'New beneficiary', 'You have not paid this beneficiary before. Confirm via official channels.', 0.55, 0.7, { beneficiary }));
    }
    return out;
  }

  private sig(code: string, label: string, description: string, weight: number, confidence: number, evidence: Record<string, unknown>): DetectedSignal {
    return { type: 'CONTEXTUAL', code, label, description, weight, confidence, evidence, detectorName: this.name, detectorVersion: this.version };
  }
}