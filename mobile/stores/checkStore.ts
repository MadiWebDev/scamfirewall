import { create } from 'zustand';
import { ScamCheckRequest, ScamCheckResult, EventChannel, RiskLevel } from '@/types';

interface CheckState {
  // Current check state
  currentRequest: ScamCheckRequest | null;
  currentResult: ScamCheckResult | null;
  isAnalyzing: boolean;
  error: string | null;
  
  // Recent checks history (session only)
  recentChecks: ScamCheckResult[];
  
  // Actions
  setRequest: (request: ScamCheckRequest | null) => void;
  setResult: (result: ScamCheckResult | null) => void;
  setAnalyzing: (analyzing: boolean) => void;
  setError: (error: string | null) => void;
  addToHistory: (result: ScamCheckResult) => void;
  clearHistory: () => void;
  reset: () => void;
}

export const useCheckStore = create<CheckState>((set) => ({
  // Initial state
  currentRequest: null,
  currentResult: null,
  isAnalyzing: false,
  error: null,
  recentChecks: [],

  // Actions
  setRequest: (request) => set({ currentRequest: request, error: null }),
  
  setResult: (result) => set({ currentResult: result, isAnalyzing: false }),
  
  setAnalyzing: (analyzing) => set({ isAnalyzing: analyzing, error: null }),
  
  setError: (error) => set({ error, isAnalyzing: false }),
  
  addToHistory: (result) => set((state) => ({
    recentChecks: [result, ...state.recentChecks].slice(0, 10),
  })),
  
  clearHistory: () => set({ recentChecks: [] }),
  
  reset: () => set({
    currentRequest: null,
    currentResult: null,
    isAnalyzing: false,
    error: null,
  }),
}));

// Helper to create a new check request
export const createCheckRequest = (
  channel: EventChannel,
  content?: string,
  imageUri?: string,
  metadata?: Record<string, unknown>
): ScamCheckRequest => ({
  channel,
  content,
  imageUri,
  metadata,
});

// Mock result generator for development
export const generateMockResult = (
  request: ScamCheckRequest,
  riskLevel: RiskLevel = RiskLevel.MEDIUM
): ScamCheckResult => {
  const isHighRisk = riskLevel === RiskLevel.HIGH || riskLevel === RiskLevel.CRITICAL;
  
  return {
    eventId: `mock-${Date.now()}`,
    riskLevel,
    scamType: ScamType.BANK_IMPERSONATION,
    signals: [
      {
        id: '1',
        type: 'MANIPULATION',
        code: 'URGENCY_CUE',
        label: 'Urgency Pressure',
        description: 'The message creates artificial time pressure to act quickly',
        weight: 0.8,
        confidence: 0.9,
      },
      {
        id: '2',
        type: 'TECHNICAL',
        code: 'SUSPICIOUS_LINK',
        label: 'Suspicious Link',
        description: 'Link domain does not match claimed sender',
        weight: 0.7,
        confidence: 0.85,
      },
    ],
    intervention: {
      id: `int-${Date.now()}`,
      action: isHighRisk ? InterventionAction.STRONG_WARN : InterventionAction.WARN,
      riskLevel,
      scamType: ScamType.BANK_IMPERSONATION,
      headline: isHighRisk 
        ? 'This appears to be a bank impersonation scam'
        : 'Be cautious - this may be suspicious',
      reasons: [
        { code: 'URGENCY_CUE', label: 'Uses urgency to pressure you' },
        { code: 'SUSPICIOUS_LINK', label: 'Link does not match your bank' },
      ],
      doNotDo: [
        'Do not click any links in this message',
        'Do not share your OTP or password',
        'Do not call numbers provided in this message',
      ],
      safestNext: [
        'Log into your bank directly using their official app or website',
        'Call the number on the back of your bank card',
        'Contact your bank through official channels only',
      ],
      verifyVia: [
        'Your bank\'s official mobile app',
        'Phone number on your bank card',
        'Official bank website (type URL manually)',
      ],
      uncertainty: 'While this shows strong scam indicators, we cannot be 100% certain without deeper analysis',
    },
  };
};

// Import needed for mock
import { InterventionAction } from '@/types';
