// Domain Types for Scam Firewall Mobile App

export enum UserRole {
  CONSUMER = 'CONSUMER',
  FAMILY_MANAGER = 'FAMILY_MANAGER',
  ENTERPRISE_ADMIN = 'ENTERPRISE_ADMIN',
}

export enum AgeBand {
  UNDER_18 = 'UNDER_18',
  AGE_18_29 = 'AGE_18_29',
  AGE_30_49 = 'AGE_30_49',
  AGE_50_64 = 'AGE_50_64',
  AGE_65_PLUS = 'AGE_65_PLUS',
}

export enum EventChannel {
  CALL = 'CALL',
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  MESSAGING = 'MESSAGING',
  LINK = 'LINK',
  QR_CODE = 'QR_CODE',
  INVOICE = 'INVOICE',
  PAYMENT = 'PAYMENT',
  LOGIN_PROMPT = 'LOGIN_PROMPT',
  HIGH_RISK_ACTION = 'HIGH_RISK_ACTION',
}

export enum ScamType {
  BANK_IMPERSONATION = 'BANK_IMPERSONATION',
  GOVERNMENT_IMPERSONATION = 'GOVERNMENT_IMPERSONATION',
  TECH_SUPPORT = 'TECH_SUPPORT',
  PARCEL_DELIVERY = 'PARCEL_DELIVERY',
  KYC_PHISHING = 'KYC_PHISHING',
  ROMANCE = 'ROMANCE',
  INVESTMENT = 'INVESTMENT',
  CRYPTO_TRANSFER = 'CRYPTO_TRANSFER',
  PAYMENT_DIVERSION = 'PAYMENT_DIVERSION',
  OTP_HARVESTING = 'OTP_HARVESTING',
  FAKE_INVOICE = 'FAKE_INVOICE',
  REMOTE_ACCESS = 'REMOTE_ACCESS',
  UNKNOWN = 'UNKNOWN',
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum InterventionAction {
  EXPLAIN = 'EXPLAIN',
  WARN = 'WARN',
  STRONG_WARN = 'STRONG_WARN',
  REQUIRE_OFFLINE_VERIFICATION = 'REQUIRE_OFFLINE_VERIFICATION',
  ESCALATE_TRUSTED_CONTACT = 'ESCALATE_TRUSTED_CONTACT',
  SHOW_RECOVERY = 'SHOW_RECOVERY',
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  ageBand?: AgeBand;
  language: string;
  country: string;
  role: UserRole;
  elderMode: boolean;
  onboardedAt?: Date;
  createdAt: Date;
}

export interface UserRiskProfile {
  sensitivity: 'gentle' | 'balanced' | 'strict';
  channelsEnabled: {
    call: boolean;
    sms: boolean;
    email: boolean;
    messaging: boolean;
    link: boolean;
    qr: boolean;
    invoice: boolean;
    payment: boolean;
  };
  trustedEscalation: boolean;
  highRiskActionLock: boolean;
}

export interface TrustedContact {
  id: string;
  displayName: string;
  phone?: string;
  email?: string;
  channelPref: 'sms' | 'email' | 'push';
  priority: number;
}

export interface FamilyPlan {
  id: string;
  name: string;
  members: ProtectedPerson[];
}

export interface ProtectedPerson {
  id: string;
  displayName: string;
  relationship?: string;
  elderMode: boolean;
  lastActiveAt?: Date;
}

export interface RiskSignal {
  id: string;
  type: 'TECHNICAL' | 'MANIPULATION' | 'CONTEXTUAL' | 'CHANNEL';
  code: string;
  label: string;
  description: string;
  weight: number;
  confidence: number;
  uncertainty?: string;
}

export interface Intervention {
  id: string;
  action: InterventionAction;
  riskLevel: RiskLevel;
  scamType: ScamType;
  headline: string;
  reasons: Array<{ code: string; label: string }>;
  doNotDo: string[];
  safestNext: string[];
  verifyVia: string[];
  uncertainty?: string;
}

export interface ScamCheckResult {
  eventId: string;
  riskLevel: RiskLevel;
  scamType?: ScamType;
  signals: RiskSignal[];
  intervention: Intervention;
}

export interface RecoveryTask {
  id: string;
  order: number;
  title: string;
  detail: string;
  category: 'bank' | 'password' | 'device' | 'report' | 'evidence';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
}

export interface RecoveryChecklist {
  id: string;
  scamType: ScamType;
  tasks: RecoveryTask[];
  completedAt?: Date;
}

export interface ScamEvent {
  id: string;
  channel: EventChannel;
  status: string;
  riskLevel?: RiskLevel;
  scamType?: ScamType;
  redactedSummary?: string;
  createdAt: Date;
  intervention?: Intervention;
  recovery?: RecoveryChecklist;
}

export interface ScamCheckRequest {
  channel: EventChannel;
  content?: string;
  imageUri?: string;
  metadata?: Record<string, unknown>;
}

export interface AlertEvent {
  id: string;
  title: string;
  body: string;
  riskLevel: RiskLevel;
  eventId: string;
  readAt?: Date;
  createdAt: Date;
}

export interface TrendMetric {
  period: string;
  eventCount: number;
  byRiskLevel: Record<string, number>;
}
