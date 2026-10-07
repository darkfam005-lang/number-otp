import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Key, 
  PhoneCall, 
  MessageSquare, 
  Clock, 
  ShieldCheck, 
  Share2 
} from 'lucide-react';
import { LamixMessage, SupportedLanguage } from '../types/lamix';
import { getTranslation } from '../utils/translations';
import { triggerHaptic } from '../utils/audioHaptics';

interface MessageDetailModalProps {
  message: LamixMessage | null;
  language: SupportedLanguage;
  onClose: () => void;
}

export const MessageDetailModal: React.FC<MessageDetailModalProps> = ({
  message,
  language,
  onClose,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const t = getTranslation(language);

  if (!message) return null;

  const handleCopy = (text: string, key: string) => {
    triggerHaptic(30);
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleShare = () => {
    triggerHaptic(30);
    if (navigator.share) {
      navigator.share({
        title: `SMS from ${message.sender}`,
        text: `${message.sender}: ${message.text} (${message.recipient})`,
      }).catch(() => {});
    } else {
      handleCopy(message.text, 'text');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping-slow" />
            <h3 className="font-bold text-base text-white">{t.details}</h3>
            <span className="text-xs text-slate-400 font-mono">#{message.id}</span>
          </div>
          <button
            onClick={() => {
              triggerHaptic(20);
              onClose();
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sender & Status Row */}
        <div className="mt-4 flex items-center justify-between bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
          <div>
            <div className="text-xs text-slate-400">Sender ID</div>
            <div className="font-bold text-base text-white tracking-wide">{message.sender}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400">Status</div>
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize mt-0.5 ${
              message.status === 'delivered'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : message.status === 'pending'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}>
              {message.status}
            </span>
          </div>
        </div>

        {/* Extracted OTP Highlight if available */}
        {message.extractedOtp && (
          <div className="mt-3.5 bg-gradient-to-r from-cyan-950/70 to-blue-950/70 border border-cyan-500/40 p-3.5 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-cyan-300 font-medium">Extracted OTP Code</div>
                <div className="text-xl font-mono font-black text-white tracking-widest">
                  {message.extractedOtp}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleCopy(message.extractedOtp!, 'otp')}
              className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition flex items-center gap-1 shadow-md shadow-cyan-500/20"
            >
              {copiedKey === 'otp' ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{t.copied}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{t.copyOtp}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Message Body */}
        <div className="mt-3.5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>Message Content</span>
            <span className="font-mono text-[11px] text-slate-400">
              {message.text.length} chars ({Math.ceil(message.text.length / 160)} SMS)
            </span>
          </div>
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap select-all font-sans">
            {message.text}
          </div>
        </div>

        {/* Details Grid */}
        <div className="mt-4 grid grid-cols-2 gap-2.5 text-xs">
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block mb-1">Destination Number</span>
            <div className="font-mono font-semibold text-white flex items-center justify-between">
              <span className="truncate">{message.recipient}</span>
              <button
                onClick={() => handleCopy(message.recipient, 'recipient')}
                className="text-slate-400 hover:text-cyan-400"
              >
                {copiedKey === 'recipient' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block mb-1">Timestamp</span>
            <div className="font-mono text-slate-300 flex items-center gap-1 text-[11px]">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>{new Date(message.timestamp).toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block mb-1">SIM / Route</span>
            <div className="text-slate-200 font-medium">
              SIM {message.sim || 1} • {message.route || 'Lamix Gateway'}
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block mb-1">Country</span>
            <div className="text-slate-200 font-medium">
              {message.country || 'International'} ({message.countryCode || 'INT'})
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex items-center gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={() => handleCopy(message.text, 'text')}
            className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-1.5"
          >
            {copiedKey === 'text' ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{t.copied}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-cyan-400" />
                <span>Copy SMS Text</span>
              </>
            )}
          </button>

          <button
            onClick={handleShare}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center justify-center"
            title="Share"
          >
            <Share2 className="w-4 h-4 text-cyan-400" />
          </button>

          {/* Quick Call / Native SMS buttons */}
          <a
            href={`sms:${message.recipient}`}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 transition flex items-center justify-center"
            title="SMS recipient directly"
          >
            <MessageSquare className="w-4 h-4" />
          </a>

          <a
            href={`tel:${message.recipient}`}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 transition flex items-center justify-center"
            title="Call recipient"
          >
            <PhoneCall className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};
