import { LamixConfig, LamixMessage, ConnectionStatus } from '../types/lamix';
import { extractOtpCode } from '../utils/audioHaptics';

const CONFIG_STORAGE_KEY = 'lamix_mobile_config_v1';
const CACHED_MESSAGES_KEY = 'lamix_cached_messages_v1';

export const DEFAULT_CONFIG: LamixConfig = {
  baseUrl: 'https://panel.lamix.org',
  token: 'N665gf_qValm0_rAdf7xRaHyCBsdAt7T14a6CPJIfU0',
  connectionMode: 'auto',
  autoRefresh: true,
  refreshInterval: 10,
  audioNotification: true,
  vibrationNotification: true,
  currency: 'USD',
  ratePerSms: 0.008,
  language: 'bn',
  showSimulatedPreview: true,
};

// Seed realistic test traffic records so user can explore all views even if their live account has 0 messages right now
export function generateRealisticSampleMessages(): LamixMessage[] {
  const now = Date.now();
  const samples: Array<Omit<LamixMessage, 'id' | 'timestamp' | 'extractedOtp'>> = [
    {
      recipient: '+8801712984512',
      sender: 'WhatsApp',
      text: 'Your WhatsApp Business code: 749-102. Do not share this code with anyone.',
      status: 'delivered',
      route: 'BD_Direct_OTP',
      sim: 1,
      country: 'Bangladesh',
      countryCode: 'BD',
    },
    {
      recipient: '+8801823451980',
      sender: 'Google',
      text: 'G-839210 is your Google verification code. Never give this code to anyone.',
      status: 'delivered',
      route: 'BD_Direct_OTP',
      sim: 1,
      country: 'Bangladesh',
      countryCode: 'BD',
    },
    {
      recipient: '+8801934567890',
      sender: 'Telegram',
      text: 'Telegram code: 49215. You can also tap this link to log in: https://t.me/login/49215',
      status: 'delivered',
      route: 'BD_A2P_Route',
      sim: 2,
      country: 'Bangladesh',
      countryCode: 'BD',
    },
    {
      recipient: '+8801552349811',
      sender: 'bKash OTP',
      text: 'Your bKash verification code is 610842. Valid for 3 minutes. Do not share with anyone.',
      status: 'delivered',
      route: 'BD_Priority_OTP',
      sim: 1,
      country: 'Bangladesh',
      countryCode: 'BD',
    },
    {
      recipient: '+8801648901234',
      sender: 'Facebook',
      text: '628491 is your Facebook security code. Enter it to confirm your account.',
      status: 'delivered',
      route: 'BD_A2P_Route',
      sim: 2,
      country: 'Bangladesh',
      countryCode: 'BD',
    },
    {
      recipient: '+8801309876543',
      sender: 'TikTok',
      text: '[TikTok] 401825 is your verification code. Valid for 5 minutes.',
      status: 'pending',
      route: 'BD_A2P_Route',
      sim: 1,
      country: 'Bangladesh',
      countryCode: 'BD',
    },
    {
      recipient: '+8801755123987',
      sender: 'Nagad Alert',
      text: 'Your Nagad login PIN reset OTP is 921473. Never disclose to anyone.',
      status: 'delivered',
      route: 'BD_Priority_OTP',
      sim: 1,
      country: 'Bangladesh',
      countryCode: 'BD',
    },
    {
      recipient: '+8801876543210',
      sender: 'Daraz',
      text: 'Your Daraz order #BD-884912 has been packed and handed over to delivery rider.',
      status: 'delivered',
      route: 'BD_Promo_Route',
      sim: 2,
      country: 'Bangladesh',
      countryCode: 'BD',
    },
  ];

  return samples.map((s, idx) => {
    const timeOffset = idx * 1000 * 60 * (idx + 1) * 3;
    const msgTime = new Date(now - timeOffset).toISOString();
    return {
      ...s,
      id: `sample-${idx + 1}`,
      timestamp: msgTime,
      extractedOtp: extractOtpCode(s.text) || undefined,
      payout: 0.008,
    };
  });
}

export function loadSavedConfig(): LamixConfig {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch {
    // fallback to default
  }
  return { ...DEFAULT_CONFIG };
}

export function saveConfig(config: LamixConfig): void {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save Lamix config:', err);
  }
}

export function loadCachedMessages(): LamixMessage[] {
  try {
    const raw = localStorage.getItem(CACHED_MESSAGES_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveCachedMessages(messages: LamixMessage[]): void {
  try {
    localStorage.setItem(CACHED_MESSAGES_KEY, JSON.stringify(messages.slice(0, 500)));
  } catch {
    // ignore
  }
}

export interface FetchResult {
  messages: LamixMessage[];
  count: number;
  status: ConnectionStatus;
  isSimulated: boolean;
}

export async function fetchLamixMessages(config: LamixConfig): Promise<FetchResult> {
  const startTime = performance.now();
  const token = config.token.trim();
  const baseUrl = config.baseUrl.replace(/\/+$/, '');

  let liveMessages: LamixMessage[] = [];
  let count = 0;
  let modeUsed: 'direct' | 'proxy' | 'cached' = 'direct';
  let isSuccess = false;
  let lastError = '';

  // Mode strategy
  const tryDirect = config.connectionMode === 'direct' || config.connectionMode === 'auto';
  const tryProxy = config.connectionMode === 'proxy' || config.connectionMode === 'auto';

  // 1. Try Direct Phone Fetch if allowed
  if (tryDirect) {
    try {
      const directUrl = `${baseUrl}/api/v1/messages?token=${encodeURIComponent(token)}`;
      const resp = await fetch(directUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (resp.ok) {
        const data = await resp.json();
        liveMessages = parseLamixRecords(data);
        count = data.count ?? liveMessages.length;
        modeUsed = 'direct';
        isSuccess = true;
      } else {
        lastError = `HTTP ${resp.status}: ${resp.statusText}`;
      }
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : 'Direct fetch failed';
    }
  }

  // 2. Try Proxy Tunnel if direct failed and proxy is enabled
  if (!isSuccess && tryProxy) {
    try {
      const proxyUrl = `/api/lamix-proxy/api/v1/messages?token=${encodeURIComponent(token)}`;
      const resp = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (resp.ok) {
        const data = await resp.json();
        liveMessages = parseLamixRecords(data);
        count = data.count ?? liveMessages.length;
        modeUsed = 'proxy';
        isSuccess = true;
      } else {
        lastError = `Proxy HTTP ${resp.status}: ${resp.statusText}`;
      }
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : 'Proxy tunnel failed';
    }
  }

  const endTime = performance.now();
  const latencyMs = Math.round(endTime - startTime);

  if (isSuccess) {
    // Save to cache
    saveCachedMessages(liveMessages);

    // If live records is 0, and user enabled simulated preview, provide preview so app isn't blank
    const shouldUsePreview = liveMessages.length === 0 && config.showSimulatedPreview;
    const finalMessages = shouldUsePreview ? generateRealisticSampleMessages() : liveMessages;

    return {
      messages: finalMessages,
      count: liveMessages.length > 0 ? count : finalMessages.length,
      isSimulated: shouldUsePreview,
      status: {
        state: 'connected',
        modeUsed,
        latencyMs,
        lastSyncTime: new Date().toISOString(),
        recordCount: liveMessages.length,
      },
    };
  }

  // If failed, load from local cache so app keeps functioning on phone
  const cached = loadCachedMessages();
  const fallbackList = cached.length > 0 ? cached : (config.showSimulatedPreview ? generateRealisticSampleMessages() : []);

  return {
    messages: fallbackList,
    count: fallbackList.length,
    isSimulated: cached.length === 0 && config.showSimulatedPreview,
    status: {
      state: cached.length > 0 ? 'connected' : 'error',
      modeUsed: 'cached',
      latencyMs,
      lastSyncTime: new Date().toISOString(),
      errorMessage: lastError || 'Could not reach Lamix server',
      recordCount: fallbackList.length,
    },
  };
}

// Helper to safely parse Lamix panel response records
function parseLamixRecords(data: unknown): LamixMessage[] {
  if (!data || typeof data !== 'object') return [];
  const rawList = Array.isArray((data as { records?: unknown[] }).records)
    ? (data as { records: unknown[] }).records
    : Array.isArray(data)
    ? (data as unknown[])
    : [];

  return rawList.map((item, index) => {
    const obj = (item && typeof item === 'object') ? (item as Record<string, unknown>) : {};
    const text = String(obj.text || obj.message || obj.body || obj.content || '');
    const recipient = String(obj.recipient || obj.destination || obj.number || obj.to || '');
    const sender = String(obj.sender || obj.from || obj.senderId || 'Lamix');
    const rawStatus = String(obj.status || 'delivered').toLowerCase();
    
    let status: LamixMessage['status'] = 'delivered';
    if (rawStatus.includes('fail') || rawStatus.includes('reject')) status = 'failed';
    else if (rawStatus.includes('pend') || rawStatus.includes('queue')) status = 'pending';
    else if (rawStatus.includes('sent')) status = 'sent';
    else if (rawStatus.includes('rec') || rawStatus.includes('inbox')) status = 'received';

    const timestamp = obj.timestamp || obj.created_at || obj.date || obj.time;
    const timeIso = timestamp ? new Date(String(timestamp)).toISOString() : new Date().toISOString();

    return {
      id: String(obj.id || obj.messageId || `msg-${index}-${Date.now()}`),
      recipient,
      sender,
      text,
      status,
      timestamp: timeIso,
      route: obj.route ? String(obj.route) : undefined,
      payout: typeof obj.payout === 'number' ? obj.payout : 0.008,
      sim: (obj.sim === 2 || obj.sim === '2') ? 2 : 1,
      country: obj.country ? String(obj.country) : (recipient.startsWith('+880') ? 'Bangladesh' : undefined),
      countryCode: obj.countryCode ? String(obj.countryCode) : (recipient.startsWith('+880') ? 'BD' : undefined),
      extractedOtp: extractOtpCode(text) || undefined,
    };
  });
}

// Ping / Connection tester
export async function testConnection(config: LamixConfig): Promise<{
  ok: boolean;
  latencyMs: number;
  mode: 'direct' | 'proxy';
  status: number;
  details: string;
}> {
  const start = performance.now();
  const token = config.token.trim();
  const baseUrl = config.baseUrl.replace(/\/+$/, '');

  // 1. Test direct
  try {
    const directUrl = `${baseUrl}/api/v1/messages?token=${encodeURIComponent(token)}`;
    const res = await fetch(directUrl, { method: 'GET' });
    const latency = Math.round(performance.now() - start);
    if (res.ok) {
      return {
        ok: true,
        latencyMs: latency,
        mode: 'direct',
        status: res.status,
        details: 'Direct Phone Connection Successful! Server verified token.',
      };
    }
  } catch {
    // try proxy
  }

  // 2. Test proxy
  try {
    const proxyStart = performance.now();
    const proxyUrl = `/api/lamix-proxy/api/v1/messages?token=${encodeURIComponent(token)}`;
    const res = await fetch(proxyUrl, { method: 'GET' });
    const latency = Math.round(performance.now() - proxyStart);
    if (res.ok) {
      return {
        ok: true,
        latencyMs: latency,
        mode: 'proxy',
        status: res.status,
        details: 'Proxy Tunnel Connected! Bypasses CORS and connects securely to Lamix.',
      };
    }
    return {
      ok: false,
      latencyMs: latency,
      mode: 'proxy',
      status: res.status,
      details: `Server returned status HTTP ${res.status}. Check token accuracy.`,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Network failure';
    return {
      ok: false,
      latencyMs: 0,
      mode: 'proxy',
      status: 0,
      details: `Connection failed: ${errorMsg}`,
    };
  }
}
