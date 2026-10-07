export interface LamixMessage {
  id: string | number;
  recipient: string;
  sender: string;
  text: string;
  status: 'delivered' | 'sent' | 'pending' | 'failed' | 'received';
  timestamp: string; // ISO format or unix timestamp
  route?: string;
  payout?: number;
  sim?: number | string;
  country?: string;
  countryCode?: string;
  extractedOtp?: string;
}

export interface LamixApiResponse {
  records?: LamixMessage[];
  count?: number;
  error?: string;
  errorId?: string;
  [key: string]: unknown;
}

export type ConnectionMode = 'auto' | 'direct' | 'proxy';
export type SupportedLanguage = 'bn' | 'en';
export type SupportedCurrency = 'USD' | 'BDT' | 'EUR' | 'INR';

export interface LamixConfig {
  baseUrl: string;
  token: string;
  connectionMode: ConnectionMode;
  autoRefresh: boolean;
  refreshInterval: number; // in seconds
  audioNotification: boolean;
  vibrationNotification: boolean;
  currency: SupportedCurrency;
  ratePerSms: number; // in chosen currency
  language: SupportedLanguage;
  showSimulatedPreview: boolean;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  group: string;
  createdAt: string;
  notes?: string;
}

export interface SmsTemplate {
  id: string;
  title: string;
  body: string;
  category: 'OTP' | 'Alert' | 'Marketing' | 'Personal';
}

export interface ConnectionStatus {
  state: 'connected' | 'connecting' | 'error' | 'idle';
  modeUsed: 'direct' | 'proxy' | 'cached';
  latencyMs: number;
  lastSyncTime: string | null;
  errorMessage?: string;
  recordCount: number;
}
