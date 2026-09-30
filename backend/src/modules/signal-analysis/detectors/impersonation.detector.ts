// src/modules/signal-analysis/detectors/impersonation.detector.ts
import { SignalDetector, DetectorContext, DetectedSignal } from '../types';

const KNOWN_BRANDS = ['paypal', 'amazon', 'fedex', 'ups', 'dhl', 'apple', 'microsoft', 'google', 'netflix', 'chase', 'wells fargo', 'hsbc'];

export class ImpersonationDetector implements SignalDetector {
  name = 'impersonation.detector';
  version = '1.0.0';

  async detect(ctx: DetectorContext): Promise<DetectedSignal[]> {
    const text = (ctx.text ?? '').toLowerCase();
    const url = (ctx.url ?? '').toLowerCase();
    const signals: DetectedSignal[] = [];

    for (const brand of KNOWN_BRANDS) {
      const inText = text.includes(brand);
      const inUrl = url.includes(brand);
      // claims brand in text but URL doesn't match brand domain → impersonation cue
      if (inText && url && !inUrl) {
        signals.push({
          type: 'TECHNICAL',
          code: 'BRAND_DOMAIN_MISMATCH',
          label: `Possible ${brand} impersonation`,
          description: `Message mentions "${brand}" but the linked domain does not match. Lookalike domains are a common impersonation tactic.`,
          weight: 0.75,
          confidence: 0.7,
          evidence: { brand, url },
          detectorName: this.name,
          detectorVersion: this.version,
        });
      }
    }
    return signals;
  }
}