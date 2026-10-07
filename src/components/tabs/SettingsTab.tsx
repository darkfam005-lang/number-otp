import React, { useState } from 'react';
import { 
  Settings, 
  Key, 
  Globe, 
  Radio, 
  CheckCircle2, 
  AlertCircle, 
  Volume2, 
  Vibrate, 
  RotateCcw, 
  Save, 
  ExternalLink, 
  Sparkles,
  Zap,
  DollarSign,
  Smartphone,
  QrCode
} from 'lucide-react';
import { LamixConfig, SupportedLanguage, ConnectionMode, SupportedCurrency } from '../../types/lamix';
import { getTranslation } from '../../utils/translations';
import { triggerHaptic, playSmsChime } from '../../utils/audioHaptics';
import { testConnection } from '../../services/lamixApi';

interface SettingsTabProps {
  config: LamixConfig;
  language: SupportedLanguage;
  onSaveConfig: (newConfig: LamixConfig) => void;
  onOpenInstallModal?: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  config,
  language,
  onSaveConfig,
  onOpenInstallModal,
}) => {
  const t = getTranslation(language);
  const [formData, setFormData] = useState<LamixConfig>({ ...config });
  const [showToken, setShowToken] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Ping test state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    latencyMs: number;
    mode: 'direct' | 'proxy';
    status: number;
    details: string;
  } | null>(null);

  const handleTestConnection = async () => {
    triggerHaptic(40);
    setIsTesting(true);
    setTestResult(null);

    const result = await testConnection(formData);
    setTestResult(result);
    setIsTesting(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic(50);
    onSaveConfig(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Title */}
      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-sm">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          <span>{t.settingsTitle}</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {language === 'bn'
            ? 'আপনার ল্যামিক্স এপিআই টোকেন, কানেকশন এবং ফোন নোটিফিকেশন কনফিগার করুন'
            : 'Configure API credentials, phone connectivity mode, and alert preferences'}
        </p>
      </div>

      {/* Android Installation & QR Guide Button */}
      {onOpenInstallModal && (
        <div className="bg-gradient-to-r from-cyan-950/70 via-sky-950/70 to-indigo-950/70 p-4 rounded-2xl border border-cyan-500/40 shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500 text-slate-950">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-white">
                {language === 'bn' ? 'অ্যান্ড্রয়েড ফোন অ্যাপ ইনস্টলার ও QR স্ক্যানার' : 'Android App Installer & QR Scanner'}
              </h3>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {language === 'bn' ? 'ফোনের স্ক্রিনে ইনস্টল করার সহজ গাইড ও কিউআর কোড' : 'Get installation steps, QR scanner & direct link'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic(30);
              onOpenInstallModal();
            }}
            className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition whitespace-nowrap shadow-sm shadow-cyan-500/20 flex items-center gap-1.5"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'গাইড ও QR' : 'Install Guide'}</span>
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        {/* API Credentials Card */}
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-sm space-y-3.5">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Key className="w-4 h-4 text-cyan-400" />
            <span>{t.apiCredentials}</span>
          </h3>

          {/* Token Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {t.tokenLabel}
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                required
                value={formData.token}
                onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                className="w-full pl-3.5 pr-20 py-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-2 top-2 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 transition"
              >
                {showToken ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{t.tokenHelp}</p>
          </div>

          {/* Base URL Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {t.baseUrlLabel}
            </label>
            <input
              type="text"
              required
              value={formData.baseUrl}
              onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Connection Mode Radio */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {t.connectionModeLabel}
            </label>
            <div className="grid grid-cols-1 gap-2 text-xs">
              {[
                { id: 'auto', title: t.modeAuto, desc: 'Tries direct phone connection first, falls back to proxy' },
                { id: 'direct', title: t.modeDirect, desc: 'Runs entirely on phone internet (no server needed)' },
                { id: 'proxy', title: t.modeProxy, desc: 'Bypasses browser CORS restrictions smoothly' },
              ].map((opt) => (
                <label
                  key={opt.id}
                  onClick={() => triggerHaptic(20)}
                  className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                    formData.connectionMode === opt.id
                      ? 'bg-cyan-950/40 border-cyan-500/50 text-white'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="connectionMode"
                    value={opt.id}
                    checked={formData.connectionMode === opt.id}
                    onChange={(e) => setFormData({ ...formData, connectionMode: e.target.value as ConnectionMode })}
                    className="mt-0.5 text-cyan-500 focus:ring-cyan-500"
                  />
                  <div>
                    <div className="font-bold text-xs">{opt.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Test Ping Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Zap className={`w-3.5 h-3.5 text-cyan-400 ${isTesting ? 'animate-bounce' : ''}`} />
              <span>{isTesting ? t.testing : t.testConnectionBtn}</span>
            </button>

            {testResult && (
              <div className={`mt-2.5 p-3 rounded-xl text-xs flex items-start gap-2.5 ${
                testResult.ok
                  ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-950/60 border border-rose-500/30 text-rose-300'
              }`}>
                {testResult.ok ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold">
                    {testResult.ok ? 'Connection Verified' : 'Connection Check Failed'} ({testResult.latencyMs}ms)
                  </div>
                  <div className="text-[11px] mt-0.5 text-slate-300">{testResult.details}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sync & Audio Preferences */}
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-sm space-y-3.5">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-cyan-400" />
            <span>Preferences & Alerts</span>
          </h3>

          {/* Sound Alert Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <div>
                <div className="text-xs font-medium text-slate-200">{t.soundAlerts}</div>
                <button
                  type="button"
                  onClick={() => playSmsChime()}
                  className="text-[11px] text-cyan-400 hover:underline mt-0.5"
                >
                  Test Sound
                </button>
              </div>
            </div>
            <input
              type="checkbox"
              checked={formData.audioNotification}
              onChange={(e) => setFormData({ ...formData, audioNotification: e.target.checked })}
              className="w-4 h-4 text-cyan-500 rounded bg-slate-950 border-slate-800"
            />
          </div>

          {/* Vibration Alert Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2.5">
              <Vibrate className="w-4 h-4 text-cyan-400" />
              <div>
                <div className="text-xs font-medium text-slate-200">{t.vibrationAlerts}</div>
                <button
                  type="button"
                  onClick={() => triggerHaptic([100, 50, 100])}
                  className="text-[11px] text-cyan-400 hover:underline mt-0.5"
                >
                  Test Vibration
                </button>
              </div>
            </div>
            <input
              type="checkbox"
              checked={formData.vibrationNotification}
              onChange={(e) => setFormData({ ...formData, vibrationNotification: e.target.checked })}
              className="w-4 h-4 text-cyan-500 rounded bg-slate-950 border-slate-800"
            />
          </div>

          {/* Auto Refresh & Interval */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div className="text-xs font-medium text-slate-200">{t.autoRefreshToggle}</div>
            <input
              type="checkbox"
              checked={formData.autoRefresh}
              onChange={(e) => setFormData({ ...formData, autoRefresh: e.target.checked })}
              className="w-4 h-4 text-cyan-500 rounded bg-slate-950 border-slate-800"
            />
          </div>

          {formData.autoRefresh && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">{t.refreshIntervalLabel}</span>
              <select
                value={formData.refreshInterval}
                onChange={(e) => setFormData({ ...formData, refreshInterval: parseInt(e.target.value, 10) })}
                className="bg-slate-950 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-800 font-mono focus:outline-none"
              >
                <option value={5}>Every 5 seconds</option>
                <option value={10}>Every 10 seconds</option>
                <option value={20}>Every 20 seconds</option>
                <option value={60}>Every 60 seconds</option>
              </select>
            </div>
          )}

          {/* Payout Rate Configuration */}
          <div className="pt-2 border-t border-slate-800">
            <label className="block text-xs font-medium text-slate-200 mb-1">
              {t.payoutRateLabel}
            </label>
            <div className="flex items-center gap-2">
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value as SupportedCurrency })}
                className="bg-slate-950 text-slate-200 px-3 py-2 rounded-xl border border-slate-800 text-xs font-mono"
              >
                <option value="USD">USD ($)</option>
                <option value="BDT">BDT (৳)</option>
                <option value="EUR">EUR (€)</option>
                <option value="INR">INR (₹)</option>
              </select>
              <input
                type="number"
                step="0.001"
                min="0"
                value={formData.ratePerSms}
                onChange={(e) => setFormData({ ...formData, ratePerSms: parseFloat(e.target.value) || 0 })}
                className="flex-1 px-3 py-2 bg-slate-950 text-slate-200 rounded-xl border border-slate-800 text-xs font-mono"
              />
            </div>
          </div>

          {/* Demo Preview Simulation Toggle */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.demoPreviewToggle}</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Shows sample traffic while account has 0 messages
              </div>
            </div>
            <input
              type="checkbox"
              checked={formData.showSimulatedPreview}
              onChange={(e) => setFormData({ ...formData, showSimulatedPreview: e.target.checked })}
              className="w-4 h-4 text-cyan-500 rounded bg-slate-950 border-slate-800"
            />
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-cyan-950/40 transition flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>{saveSuccess ? t.settingsSaved : t.saveSettings}</span>
        </button>

        {/* Link to Lamix Web Panel */}
        <div className="text-center pt-2">
          <a
            href="https://panel.lamix.org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition"
          >
            <span>{t.openWebPanel}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </form>
    </div>
  );
};
