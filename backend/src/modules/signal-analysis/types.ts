// src/modules/signal-analysis/types.ts
export interface DetectorContext {
  channel: string;
  text?: string;
  url?: string;
  callerId?: string;
  invoice?: { amount?: number; currency?: string; beneficiary?: string; iban?: string };
  userHistory?: { knownPayees?: string[] };
}

export interface DetectedSignal {
  type: 'TECHNICAL' | 'MANIPULATION' | 'CONTEXTUAL' | 'CHANNEL';
  code: string;
  label: string;
  description: string;
  weight: number;       // -1..1 (positive = riskier)
  confidence: number;   // 0..1
  uncertainty?: string;
  evidence?: Record<string, unknown>;
  detectorName: string;
  detectorVersion: string;
}

export interface SignalDetector {
  name: string;
  version: string;
  detect(ctx: DetectorContext): Promise<DetectedSignal[]>;
}
