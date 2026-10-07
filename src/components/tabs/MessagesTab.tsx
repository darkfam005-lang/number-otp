import React, { useState, useMemo } from 'react';
import { 
  Search, 
  X, 
  Download, 
  Copy, 
  Check, 
  Key, 
  ExternalLink, 
  Inbox, 
  Clock, 
  Sparkles,
  Info
} from 'lucide-react';
import { LamixMessage, SupportedLanguage } from '../../types/lamix';
import { getTranslation } from '../../utils/translations';
import { triggerHaptic } from '../../utils/audioHaptics';
import { MessageDetailModal } from '../MessageDetailModal';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Smartphone } from 'lucide-react';

interface MessagesTabProps {
  messages: LamixMessage[];
  language: SupportedLanguage;
  isSimulated: boolean;
  onRefresh: () => void;
  onOpenInstallModal?: () => void;
}

export const MessagesTab: React.FC<MessagesTabProps> = ({
  messages,
  language,
  isSimulated,
  onOpenInstallModal,
}) => {
  const t = getTranslation(language);
  const { isInstalled } = usePWAInstall();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'delivered' | 'pending' | 'failed'>('all');
  const [selectedMessage, setSelectedMessage] = useState<LamixMessage | null>(null);
  const [copiedOtpId, setCopiedOtpId] = useState<string | number | null>(null);

  // Filter messages
  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      // Status filter
      if (statusFilter !== 'all' && msg.status !== statusFilter) {
        return false;
      }
      // Search filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        msg.recipient.toLowerCase().includes(q) ||
        msg.sender.toLowerCase().includes(q) ||
        msg.text.toLowerCase().includes(q) ||
        (msg.extractedOtp && msg.extractedOtp.includes(q))
      );
    });
  }, [messages, statusFilter, searchQuery]);

  const handleCopyOtp = (msg: LamixMessage, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!msg.extractedOtp) return;
    triggerHaptic(30);
    navigator.clipboard.writeText(msg.extractedOtp);
    setCopiedOtpId(msg.id);
    setTimeout(() => setCopiedOtpId(null), 2000);
  };

  const handleExportCsv = () => {
    triggerHaptic(40);
    if (messages.length === 0) return;
    const headers = ['ID', 'Recipient', 'Sender', 'Text', 'Extracted_OTP', 'Status', 'Timestamp', 'Route', 'SIM'];
    const rows = messages.map((m) => [
      m.id,
      m.recipient,
      m.sender,
      `"${m.text.replace(/"/g, '""')}"`,
      m.extractedOtp || '',
      m.status,
      m.timestamp,
      m.route || '',
      m.sim || 1,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `lamix_messages_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return language === 'bn' ? 'এইমাত্র' : 'Just now';
      if (diffMins < 60) return language === 'bn' ? `${diffMins} মি. আগে` : `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return language === 'bn' ? `${diffHours} ঘ. আগে` : `${diffHours}h ago`;
      return new Date(isoString).toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return isoString;
    }
  };

  const getSenderColor = (sender: string) => {
    const s = sender.toLowerCase();
    if (s.includes('whatsapp')) return 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30';
    if (s.includes('google')) return 'bg-blue-950/80 text-blue-400 border-blue-500/30';
    if (s.includes('telegram')) return 'bg-sky-950/80 text-sky-400 border-sky-500/30';
    if (s.includes('bkash') || s.includes('nagad') || s.includes('bank') || s.includes('otp')) {
      return 'bg-amber-950/80 text-amber-300 border-amber-500/30';
    }
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  return (
    <div className="space-y-3.5 pb-20">
      {/* Quick Android Install Card if not yet in standalone mode */}
      {!isInstalled && onOpenInstallModal && (
        <div 
          onClick={() => {
            triggerHaptic(30);
            onOpenInstallModal();
          }}
          className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-sky-950/80 to-indigo-950/80 border border-cyan-500/40 flex items-center justify-between gap-3 cursor-pointer shadow-md shadow-cyan-950/40 hover:border-cyan-400 transition"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500 text-slate-950 flex-shrink-0 shadow-sm">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-white">
                {language === 'bn' ? 'অ্যান্ড্রয়েড ফোনে অ্যাপটি ইনস্টল করুন' : 'Install Lamix App on Android'}
              </h4>
              <p className="text-[11px] text-cyan-300 mt-0.5">
                {language === 'bn' ? '১-ট্যাপে ইনস্টল করে ফোনের স্ক্রিন থেকে ফুল কন্ট্রোল করুন' : 'Tap to add to home screen & run standalone'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs whitespace-nowrap shadow-sm"
          >
            {language === 'bn' ? 'ইনস্টল' : 'Install'}
          </button>
        </div>
      )}

      {/* Search & Export Toolbar */}
      <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 shadow-sm space-y-2.5">
        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-9 pr-8 py-2 bg-slate-950 rounded-xl border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            disabled={messages.length === 0}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 disabled:opacity-40 transition flex items-center justify-center"
            title={t.exportCsv}
          >
            <Download className="w-4 h-4 text-cyan-400" />
          </button>
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
          {[
            { id: 'all', label: t.allStatus, count: messages.length },
            { id: 'delivered', label: t.delivered, count: messages.filter((m) => m.status === 'delivered').length },
            { id: 'pending', label: t.pending, count: messages.filter((m) => m.status === 'pending').length },
            { id: 'failed', label: t.failed, count: messages.filter((m) => m.status === 'failed').length },
          ].map((chip) => {
            const isSelected = statusFilter === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => {
                  triggerHaptic(20);
                  setStatusFilter(chip.id as typeof statusFilter);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm shadow-cyan-500/20'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <span>{chip.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected ? 'bg-cyan-900/30 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Simulated Preview Alert if applicable */}
      {isSimulated && (
        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200">
          <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">
            <span className="font-semibold text-amber-300 mr-1">{t.simulatedBadge}:</span>
            {t.simulatedNotice}
          </div>
        </div>
      )}

      {/* Message Count Header */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-400">
        <span>{t.totalRecords}: <strong className="text-white">{filteredMessages.length}</strong></span>
        {statusFilter !== 'all' && (
          <button
            onClick={() => setStatusFilter('all')}
            className="text-cyan-400 hover:underline"
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* Messages Feed */}
      {filteredMessages.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
            <Inbox className="w-6 h-6" />
          </div>
          <h4 className="font-semibold text-white text-sm">{t.noMessages}</h4>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            {t.noMessagesDesc}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredMessages.map((msg) => (
            <div
              key={msg.id}
              onClick={() => {
                triggerHaptic(20);
                setSelectedMessage(msg);
              }}
              className="group bg-slate-900/90 hover:bg-slate-850 p-3.5 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition cursor-pointer shadow-sm relative overflow-hidden"
            >
              {/* Top Meta Line */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Sender Pill */}
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-bold border tracking-wide ${getSenderColor(msg.sender)}`}>
                    {msg.sender}
                  </span>

                  {/* Recipient Phone */}
                  <span className="font-mono text-xs text-slate-300 font-medium tracking-tight">
                    {msg.recipient}
                  </span>

                  {/* SIM indicator */}
                  {msg.sim && (
                    <span className="text-[10px] text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 font-mono">
                      SIM {msg.sim}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Relative Time */}
                  <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {formatRelativeTime(msg.timestamp)}
                  </span>

                  {/* Status Badge */}
                  <span className={`w-2 h-2 rounded-full ${
                    msg.status === 'delivered' ? 'bg-emerald-400' :
                    msg.status === 'pending' ? 'bg-amber-400' : 'bg-rose-400'
                  }`} title={msg.status} />
                </div>
              </div>

              {/* Message Content Preview */}
              <p className="text-xs text-slate-200 leading-relaxed line-clamp-2 font-sans">
                {msg.text}
              </p>

              {/* OTP Code Badge & Quick Copy action */}
              {msg.extractedOtp && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-cyan-300">
                    <Key className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[11px] text-slate-400">OTP:</span>
                    <span className="font-mono font-black text-sm text-white tracking-wider bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                      {msg.extractedOtp}
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleCopyOtp(msg, e)}
                    className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 font-semibold text-[11px] transition flex items-center gap-1 border border-cyan-500/30"
                  >
                    {copiedOtpId === msg.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>{t.copied}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>{t.copyOtp}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Message Detail Modal */}
      <MessageDetailModal
        message={selectedMessage}
        language={language}
        onClose={() => setSelectedMessage(null)}
      />
    </div>
  );
};
