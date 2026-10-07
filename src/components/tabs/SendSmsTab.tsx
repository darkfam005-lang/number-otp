import React, { useState } from 'react';
import { 
  Send, 
  Smartphone, 
  Sparkles, 
  Check, 
  AlertCircle, 
  FileText, 
  Layers, 
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { LamixConfig, SmsTemplate, SupportedLanguage } from '../../types/lamix';
import { getTranslation } from '../../utils/translations';
import { triggerHaptic } from '../../utils/audioHaptics';

interface SendSmsTabProps {
  config: LamixConfig;
  language: SupportedLanguage;
  initialRecipient?: string;
}

const DEFAULT_TEMPLATES: SmsTemplate[] = [
  {
    id: 'tpl-otp',
    title: 'OTP Verification',
    category: 'OTP',
    body: 'Your verification code is {otp}. Valid for 5 minutes. Do not share this with anyone.',
  },
  {
    id: 'tpl-alert',
    title: 'Service Alert',
    category: 'Alert',
    body: 'Dear customer, your request has been received and is being processed. Reference ID: {ref}.',
  },
  {
    id: 'tpl-order',
    title: 'Order Status',
    category: 'Alert',
    body: 'Your order #{order_id} has been dispatched and will arrive soon. Thank you!',
  },
  {
    id: 'tpl-greeting',
    title: 'Custom Notice',
    category: 'Personal',
    body: 'Hello! This is a test message dispatched directly from Lamix Mobile Gateway.',
  },
];

export const SendSmsTab: React.FC<SendSmsTabProps> = ({
  config,
  language,
  initialRecipient = '',
}) => {
  const t = getTranslation(language);
  const [recipient, setRecipient] = useState(initialRecipient);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Character calculation
  const charLength = messageText.length;
  const isUnicode = /[^\u0000-\u00ff]/.test(messageText);
  const maxPerSms = isUnicode ? 70 : 160;
  const smsParts = Math.max(1, Math.ceil(charLength / maxPerSms));

  const handleApplyTemplate = (tpl: SmsTemplate) => {
    triggerHaptic(20);
    // replace placeholders with random sample
    const filled = tpl.body
      .replace('{otp}', Math.floor(100000 + Math.random() * 900000).toString())
      .replace('{ref}', 'LX-' + Math.floor(1000 + Math.random() * 9000))
      .replace('{order_id}', 'BD-' + Math.floor(10000 + Math.random() * 90000));
    setMessageText(filled);
  };

  // 1. Send via Native Android SIM
  const handleSendViaNativeSim = () => {
    triggerHaptic(40);
    if (!recipient.trim()) {
      setStatusMessage({ type: 'error', text: language === 'bn' ? 'প্রাপকের ফোন নম্বর দিন।' : 'Please enter a recipient number.' });
      return;
    }

    // Clean first number
    const numbers = recipient
      .split(/[,\n]/)
      .map((n) => n.trim())
      .filter(Boolean);
    const primaryNumber = numbers[0];

    // Standard Android SMS URI scheme
    const encodedBody = encodeURIComponent(messageText);
    const smsUri = `sms:${primaryNumber}?body=${encodedBody}`;

    setStatusMessage({
      type: 'info',
      text: language === 'bn'
        ? 'ফোনের ডিফল্ট মেসেজিং অ্যাপ ওপেন হচ্ছে...'
        : 'Opening native Android messaging app...',
    });

    // Launch
    window.location.href = smsUri;
  };

  // 2. Test send via Lamix API Route
  const handleSendViaLamixApi = async () => {
    triggerHaptic(40);
    if (!recipient.trim() || !messageText.trim()) {
      setStatusMessage({
        type: 'error',
        text: language === 'bn' ? 'নম্বর এবং মেসেজ উভয়ই পূরণ করুন।' : 'Please fill in both number and message text.',
      });
      return;
    }

    setIsSending(true);
    setStatusMessage(null);

    try {
      const numbers = recipient
        .split(/[,\n]/)
        .map((n) => n.trim())
        .filter(Boolean);

      const targetUrl = config.connectionMode === 'proxy'
        ? `/api/lamix-proxy/api/v1/messages?token=${encodeURIComponent(config.token)}`
        : `${config.baseUrl}/api/v1/messages?token=${encodeURIComponent(config.token)}`;

      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: numbers[0],
          recipients: numbers,
          message: messageText,
          text: messageText,
        }),
      });

      if (res.ok) {
        setStatusMessage({
          type: 'success',
          text: language === 'bn'
            ? 'ল্যামিক্স এপিআইতে সফলভাবে সাবমিট হয়েছে!'
            : 'Submitted successfully to Lamix Gateway API!',
        });
      } else {
        const data = await res.json().catch(() => ({}));
        setStatusMessage({
          type: 'info',
          text: language === 'bn'
            ? `ল্যামিক্স রাউটিং রেসপন্স: ${data.error || 'Traffic queued'}. সরাসরি ফোনের সিম দিয়ে পাঠাতে ওপরের বাটনটি ব্যবহার করুন।`
            : `Lamix response: ${data.error || 'Submitted'}. You can also use the Native SIM button to send directly from device.`,
        });
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Network error';
      setStatusMessage({
        type: 'info',
        text: language === 'bn'
          ? `এপিআই নোট: ${errMsg}। ফোনের সিম দিয়ে সরাসরি পাঠাতে "মোবাইল সিম দিয়ে সরাসরি পাঠান" বাটন ব্যবহার করুন।`
          : `Note: ${errMsg}. Use "Send via Mobile SIM" for direct device cellular dispatch.`,
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header Info */}
      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-sm">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Send className="w-5 h-5 text-cyan-400" />
          <span>{t.sendTitle}</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {t.sendSubtitle}
        </p>
      </div>

      {/* Main Send Form */}
      <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-sm space-y-3.5">
        {/* Recipient Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            {t.recipientLabel}
          </label>
          <textarea
            rows={2}
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder={t.recipientPlaceholder}
            className="w-full px-3.5 py-2.5 bg-slate-950 rounded-xl border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono transition resize-none"
          />
        </div>

        {/* Message Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300">
              {t.messageLabel}
            </label>
            <span className="text-[11px] font-mono text-slate-400">
              {charLength} {t.charCount} • {smsParts} {t.smsCount} {isUnicode ? '(Unicode)' : ''}
            </span>
          </div>
          <textarea
            rows={4}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={t.messagePlaceholder}
            className="w-full px-3.5 py-2.5 bg-slate-950 rounded-xl border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition resize-none"
          />
        </div>

        {/* Quick Canned Templates */}
        <div>
          <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.selectTemplate}</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {DEFAULT_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => handleApplyTemplate(tpl)}
                className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-medium border border-slate-800 whitespace-nowrap transition flex items-center gap-1.5"
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>{tpl.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Status Feedback Notice */}
        {statusMessage && (
          <div className={`p-3 rounded-xl text-xs flex items-start gap-2.5 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-300'
              : statusMessage.type === 'error'
              ? 'bg-rose-950/60 border border-rose-500/30 text-rose-300'
              : 'bg-cyan-950/60 border border-cyan-500/30 text-cyan-300'
          }`}>
            {statusMessage.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : statusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            ) : (
              <MessageSquare className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="leading-relaxed">{statusMessage.text}</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          {/* 1. Android Native SIM Launch */}
          <button
            onClick={handleSendViaNativeSim}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/30 transition flex items-center justify-center gap-2"
          >
            <Smartphone className="w-4 h-4" />
            <span>{t.sendViaPhoneSim}</span>
          </button>
          <p className="text-[11px] text-center text-slate-400">
            {t.sendViaPhoneDesc}
          </p>

          {/* 2. Lamix Gateway API Dispatch */}
          <button
            onClick={handleSendViaLamixApi}
            disabled={isSending}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isSending ? 'Sending...' : t.sendViaLamixApi}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
