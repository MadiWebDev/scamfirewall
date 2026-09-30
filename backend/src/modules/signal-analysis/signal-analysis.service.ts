// src/modules/signal-analysis/signal-analysis.service.ts
import { Injectable } from '@nestjs/common';
import { DetectorContext, DetectedSignal, SignalDetector } from './types';
import { UrgencyDetector } from './detectors/urgency.detector';
import { AuthorityDetector } from './detectors/authority.detector';
import { ImpersonationDetector } from './detectors/impersonation.detector';
import { LinkRiskDetector } from './detectors/link-risk.detector';
import { PaymentAnomalyDetector } from './detectors/payment-anomaly.detector';
import { SpoofingDetector } from './detectors/spoofing.detector';

@Injectable()
export class SignalAnalysisService {
  private detectors: SignalDetector[] = [
    new UrgencyDetector(),
    new AuthorityDetector(),
    new ImpersonationDetector(),
    new LinkRiskDetector(),
    new PaymentAnomalyDetector(),
    new SpoofingDetector(),
  ];

  async analyze(ctx: DetectorContext): Promise<DetectedSignal[]> {
    const results = await Promise.all(this.detectors.map(d => d.detect(ctx).catch(() => [])));
    return results.flat();
  }
}