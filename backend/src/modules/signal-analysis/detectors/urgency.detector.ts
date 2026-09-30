// src/modules/signal-analysis/detectors/urgency.detector.ts
import { SignalDetector, DetectorContext, DetectedSignal } from '../types';

const URGENCY_PATTERNS = [
  /\b(urgent|immediately|right now|act now|within (?:\d+ )?(?:minutes|hours))\b/i,
  /\b(account (?:will be|is) (?:locked|suspended|closed))\b/i,
  /\b(final (?:notice|warning))\b/i,
  /\b(verify (?:now|immediately))\b/i,
];

export class UrgencyDetector implements SignalDetector {
  name = 'urgency.detector';
  version = '1.0.0';

  async detect(ctx: DetectorContext): Promise<DetectedSignal[]> {
    if (!ctx.text) return [];
    const matches = URGENCY_PATTERNS.flatMap(rx => ctx.text!.match(rx) ?? []).filter(Boolean);
    if (matches.length === 0) return [];
    return [{
      type: 'MANIPULATION',
      code: 'URGENCY_PRESSURE',
      label: 'Urgency pressure detected',
      description: 'The message uses urgency cues to rush you. Real institutions rarely demand instant action.',
      weight: Math.min(0.3 + matches.length * 0.15, 0.85),
      confidence: 0.7,
      uncertainty: 'Urgency alone is not proof of a scam; consider with other signals.',
      evidence: { matches: matches.slice(0, 5) },
      detectorName: this.name,
      detectorVersion: this.version,
    }];
  }
}