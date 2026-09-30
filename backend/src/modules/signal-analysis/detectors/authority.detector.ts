// src/modules/signal-analysis/detectors/authority.detector.ts
import { SignalDetector, DetectorContext, DetectedSignal } from '../types';

const AUTHORITY_TERMS = [
  'irs', 'tax office', 'police', 'court', 'fraud department',
  'bank security', 'social security', 'government', 'customs', 'kyc',
];

export class AuthorityDetector implements SignalDetector {
  name = 'authority.detector';
  version = '1.0.0';

  async detect(ctx: DetectorContext): Promise<DetectedSignal[]> {
    if (!ctx.text) return [];
    const lower = ctx.text.toLowerCase();
    const hits = AUTHORITY_TERMS.filter(t => lower.includes(t));
    if (hits.length === 0) return [];
    return [{
      type: 'MANIPULATION',
      code: 'AUTHORITY_PRESSURE',
      label: 'Authority pressure detected',
      description: 'The message claims to be from an authority. Authorities rarely demand action via SMS or unsolicited calls.',
      weight: 0.55,
      confidence: 0.65,
      evidence: { hits },
      detectorName: this.name,
      detectorVersion: this.version,
    }];
  }
}