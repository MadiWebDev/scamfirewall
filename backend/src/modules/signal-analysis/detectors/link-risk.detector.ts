// src/modules/signal-analysis/detectors/link-risk.detector.ts
import { SignalDetector, DetectorContext, DetectedSignal } from '../types';

const SHORTENERS = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'is.gd', 'ow.ly'];
const SUSPICIOUS_TLDS = ['.zip', '.mov', '.top', '.click', '.country', '.work'];

export class LinkRiskDetector implements SignalDetector {
  name = 'link.detector';
  version = '1.0.0';

  async detect(ctx: DetectorContext): Promise<DetectedSignal[]> {
    const url = ctx.url ?? this.firstUrlIn(ctx.text ?? '');
    if (!url) return [];
    const signals: DetectedSignal[] = [];
    let host = '';
    try { host = new URL(url).hostname.toLowerCase(); } catch { return []; }

    if (SHORTENERS.some(s => host.endsWith(s))) {
      signals.push(this.sig('SHORTENED_URL', 'Shortened URL', 'Shorteners hide the real destination.', 0.4, 0.8, { host }));
    }
    if (SUSPICIOUS_TLDS.some(t => host.endsWith(t))) {
      signals.push(this.sig('SUSPICIOUS_TLD', 'Unusual top-level domain', 'This TLD is frequently abused in scams.', 0.45, 0.7, { host }));
    }
    if (/\d{1,3}(?:\.\d{1,3}){3}/.test(host)) {
      signals.push(this.sig('IP_LITERAL_HOST', 'IP-based URL', 'Real services rarely use raw IP addresses.', 0.6, 0.85, { host }));
    }
    if (this.looksLikeLookalike(host)) {
      signals.push(this.sig('LOOKALIKE_DOMAIN', 'Lookalike domain', 'Domain uses character substitution to mimic a real brand.', 0.7, 0.65, { host }));
    }
    return signals;
  }

  private firstUrlIn(t: string): string | null { return t.match(/https?:\/\/\S+/i)?.[0] ?? null; }

  private looksLikeLookalike(host: string) {
    return /(?:[0-9]l|rn|0o|vv|paypa[l1])/.test(host);
  }

  private sig(code: string, label: string, description: string, weight: number, confidence: number, evidence: Record<string, unknown>): DetectedSignal {
    return { type: 'TECHNICAL', code, label, description, weight, confidence, evidence, detectorName: this.name, detectorVersion: this.version };
  }
}