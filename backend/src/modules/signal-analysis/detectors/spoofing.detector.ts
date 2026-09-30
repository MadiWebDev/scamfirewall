// src/modules/signal-analysis/detectors/spoofing.detector.ts
import { SignalDetector, DetectorContext, DetectedSignal } from '../types';

export class SpoofingDetector implements SignalDetector {
  name = 'spoofing.detector';
  version = '1.0.0';

  async detect(ctx: DetectorContext): Promise<DetectedSignal[]> {
    if (!ctx.callerId) return [];
    const id = ctx.callerId.replace(/\s/g, '');
    const out: DetectedSignal[] = [];
    if (/^(\+?1?800|\+?1?888|\+?1?900)/.test(id)) {
      out.push({
        type: 'TECHNICAL', code: 'TOLLFREE_CALLER',
        label: 'Toll-free caller claiming to be your bank',
        description: 'Banks rarely call from toll-free lines without prior contact. Caller IDs can be spoofed.',
        weight: 0.5, confidence: 0.55,
        detectorName: this.name, detectorVersion: this.version,
      });
    }
    if (id.length < 7) {
      out.push({
        type: 'TECHNICAL', code: 'SHORT_CALLER_ID',
        label: 'Unusually short caller ID',
        description: 'Short codes can be impersonated. Verify by calling the number on your card.',
        weight: 0.4, confidence: 0.6,
        detectorName: this.name, detectorVersion: this.version,
      });
    }
    return out;
  }
}