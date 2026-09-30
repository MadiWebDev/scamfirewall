import {
  User,
  UserRole,
  AgeBand,
  ScamEvent,
  EventChannel,
  RiskLevel,
  ScamType,
  TrustedContact,
  ProtectedPerson,
  RecoveryChecklist,
  AlertEvent,
  TrendMetric,
} from '@/types';
import { generateMockResult } from '@/stores/checkStore';

// Mock data for development and testing
const mockUser: User = {
  id: 'user-1',
  email: 'demo@scamfirewall.app',
  fullName: 'Demo User',
  ageBand: AgeBand.AGE_50_64,
  language: 'en',
  country: 'US',
  role: UserRole.CONSUMER,
  elderMode: false,
  onboardedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
};

const mockTrustedContacts: TrustedContact[] = [
  {
    id: 'tc-1',
    displayName: 'Sarah (Daughter)',
    phone: '+1-555-0123',
    email: 'sarah@example.com',
    channelPref: 'sms',
    priority: 1,
  },
  {
    id: 'tc-2',
    displayName: 'Mike (Son)',
    phone: '+1-555-0124',
    channelPref: 'push',
    priority: 2,
  },
];

const mockFamilyMembers: ProtectedPerson[] = [
  {
    id: 'fm-1',
    displayName: 'Mom',
    relationship: 'mother',
    elderMode: true,
    lastActiveAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
];

const mockScamEvents: ScamEvent[] = [
  {
    id: 'evt-1',
    channel: EventChannel.SMS,
    status: 'ANALYZED',
    riskLevel: RiskLevel.HIGH,
    scamType: ScamType.BANK_IMPERSONATION,
    redactedSummary: 'SMS claiming account suspension with urgent link',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'evt-2',
    channel: EventChannel.CALL,
    status: 'ANALYZED',
    riskLevel: RiskLevel.CRITICAL,
    scamType: ScamType.GOVERNMENT_IMPERSONATION,
    redactedSummary: 'Caller claimed to be IRS demanding immediate payment',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'evt-3',
    channel: EventChannel.EMAIL,
    status: 'ANALYZED',
    riskLevel: RiskLevel.MEDIUM,
    scamType: ScamType.PARCEL_DELIVERY,
    redactedSummary: 'Email about missed delivery with tracking link',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
];

const mockRecoveryChecklist: RecoveryChecklist = {
  id: 'rec-1',
  scamType: ScamType.BANK_IMPERSONATION,
  tasks: [
    {
      id: 'task-1',
      order: 1,
      title: 'Contact your bank immediately',
      detail: 'Call the number on your bank card (not from the message) to report the incident',
      category: 'bank',
      status: 'COMPLETED',
    },
    {
      id: 'task-2',
      order: 2,
      title: 'Change your online banking password',
      detail: 'Log into your bank\'s official website and update your password',
      category: 'password',
      status: 'IN_PROGRESS',
    },
    {
      id: 'task-3',
      order: 3,
      title: 'Enable two-factor authentication',
      detail: 'Add an extra layer of security to your bank account',
      category: 'bank',
      status: 'PENDING',
    },
    {
      id: 'task-4',
      order: 4,
      title: 'Save evidence',
      detail: 'Screenshot the suspicious message and save it for reporting',
      category: 'evidence',
      status: 'PENDING',
    },
    {
      id: 'task-5',
      order: 5,
      title: 'Report to authorities',
      detail: 'File a report with FTC at reportfraud.ftc.gov',
      category: 'report',
      status: 'PENDING',
    },
  ],
};

const mockAlerts: AlertEvent[] = [
  {
    id: 'alert-1',
    title: 'High Risk Detected',
    body: 'A suspicious bank impersonation attempt was blocked',
    riskLevel: RiskLevel.HIGH,
    eventId: 'evt-1',
    readAt: undefined,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
];

const mockTrends: TrendMetric[] = [
  { period: '2024-01', eventCount: 3, byRiskLevel: { LOW: 1, MEDIUM: 1, HIGH: 1 } },
  { period: '2024-02', eventCount: 5, byRiskLevel: { LOW: 2, MEDIUM: 2, HIGH: 1 } },
  { period: '2024-03', eventCount: 2, byRiskLevel: { LOW: 1, MEDIUM: 1, HIGH: 0 } },
];

// Mock API implementations
export const mockAuthApi = {
  login: async (email: string, password: string) => {
    await delay(800);
    if (email === 'demo@scamfirewall.app' && password === 'password') {
      return {
        user: mockUser,
        accessToken: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
      };
    }
    throw new Error('Invalid credentials');
  },

  register: async (data: Record<string, unknown>) => {
    await delay(1000);
    return {
      user: { ...mockUser, ...data, id: 'new-user-' + Date.now() },
      accessToken: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token',
    };
  },

  refreshToken: async () => {
    await delay(500);
    return {
      accessToken: 'mock-jwt-token-new',
      refreshToken: 'mock-refresh-token-new',
    };
  },
};

export const mockCheckApi = {
  submitCheck: async (data: { channel: string; content?: string }) => {
    await delay(2000);
    const result = generateMockResult(
      { channel: data.channel as EventChannel, content: data.content },
      data.content?.includes('urgent') || data.content?.includes('now')
        ? RiskLevel.HIGH
        : RiskLevel.MEDIUM
    );
    return {
      eventId: result.eventId,
      status: 'ANALYZED',
      ...result,
    };
  },

  getHistory: async () => {
    await delay(500);
    return mockScamEvents;
  },

  submitFeedback: async () => {
    await delay(300);
    return { success: true };
  },
};

export const mockFamilyApi = {
  getFamily: async () => {
    await delay(500);
    return {
      id: 'family-1',
      name: 'My Family',
      members: mockFamilyMembers,
    };
  },

  getTrustedContacts: async () => {
    await delay(500);
    return mockTrustedContacts;
  },

  addTrustedContact: async (data: Record<string, unknown>) => {
    await delay(800);
    return {
      id: 'tc-' + Date.now(),
      ...data,
    };
  },

  removeTrustedContact: async () => {
    await delay(300);
    return { success: true };
  },
};

export const mockRecoveryApi = {
  getChecklist: async () => {
    await delay(500);
    return mockRecoveryChecklist;
  },

  updateTask: async (taskId: string, status: string) => {
    await delay(300);
    return { id: taskId, status };
  },

  getRecoveryHistory: async () => {
    await delay(500);
    return [mockRecoveryChecklist];
  },
};

export const mockSettingsApi = {
  getPolicy: async () => {
    await delay(400);
    return {
      sensitivity: 'balanced',
      channelsEnabled: {
        call: true,
        sms: true,
        email: true,
        messaging: true,
        link: true,
        qr: true,
        invoice: true,
        payment: true,
      },
      trustedEscalation: true,
      highRiskActionLock: true,
      elderMode: false,
      autoEscalateCritical: false,
      retentionDays: 90,
    };
  },

  updatePolicy: async (updates: Record<string, unknown>) => {
    await delay(400);
    return updates;
  },

  getUserProfile: async () => {
    await delay(300);
    return mockUser;
  },

  updateUserProfile: async (updates: Record<string, unknown>) => {
    await delay(400);
    return { ...mockUser, ...updates };
  },
};

export const mockAnalyticsApi = {
  getTrends: async () => {
    await delay(600);
    return mockTrends;
  },

  getEffectiveness: async () => {
    await delay(500);
    return {
      totalInterventions: 10,
      feedbackReceived: 8,
      helpfulCount: 7,
      correctCount: 8,
      byActionType: {
        WARN: { count: 6, helpfulRate: 0.83 },
        STRONG_WARN: { count: 4, helpfulRate: 1.0 },
      },
    };
  },

  getHotspots: async () => {
    await delay(500);
    return [
      { channel: 'SMS', scamType: 'BANK_IMPERSONATION', volume: 5, avgRiskScore: 0.75, trend: 'rising' },
      { channel: 'CALL', scamType: 'GOVERNMENT_IMPERSONATION', volume: 3, avgRiskScore: 0.9, trend: 'stable' },
    ];
  },
};

export const mockNotificationsApi = {
  getNotifications: async () => {
    await delay(400);
    return mockAlerts;
  },

  getUnread: async () => {
    await delay(300);
    return mockAlerts.filter(a => !a.readAt);
  },

  markAsRead: async () => {
    await delay(200);
    return { success: true };
  },
};

// Helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Feature flag to switch between mock and real API
export const USE_MOCK_API = process.env.EXPO_PUBLIC_USE_MOCK_API === 'true';

// Export combined API
export const api = {
  auth: USE_MOCK_API ? mockAuthApi : require('./api').authApi,
  check: USE_MOCK_API ? mockCheckApi : require('./api').checkApi,
  family: USE_MOCK_API ? mockFamilyApi : require('./api').familyApi,
  recovery: USE_MOCK_API ? mockRecoveryApi : require('./api').recoveryApi,
  settings: USE_MOCK_API ? mockSettingsApi : require('./api').settingsApi,
  analytics: USE_MOCK_API ? mockAnalyticsApi : require('./api').analyticsApi,
  notifications: USE_MOCK_API ? mockNotificationsApi : require('./api').notificationsApi,
};
