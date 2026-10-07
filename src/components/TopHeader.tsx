import React from 'react';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Volume2, 
  VolumeX, 
  Languages, 
  Download,
  Smartphone,
  CheckCircle2,
  Radio
} from 'lucide-react';
import { ConnectionStatus, SupportedLanguage } from '../types/lamix';
import { getTranslation } from '../utils/translations';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { triggerHaptic } from '../utils/audioHaptics';

interface TopHeaderProps {
  status: ConnectionStatus;
  isOnline: boolean;
  language: SupportedLanguage;
  soundEnabled: boolean;
  isRefreshing: boolean;
  isSimulated: boolean;
  onToggleSound: () => void;
  onToggleLanguage: () => void;
  onRefresh: () => void;
  onOpenInstallModal: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  status,
  isOnline,
  language,
  soundEnabled,
  isRefreshing,
  isSimulated,
  onToggleSound,
  onToggleLanguage,
  onRefresh,
  onOpenInstallModal,
}) => {
  const t = getTranslation(language);
  const { isInstallable, isInstalled } = usePWAInstall();

  const handleInstallClick = () => {
    triggerHaptic(50);
    onOpenInstallModal();
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white shadow-lg">
      {/* Mobile Top Bar */}
      <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Brand & Connection State */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-indigo-600 p-0.5 shadow-md shadow-cyan-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            </div>
            {/* Live Indicator Dot */}
            <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-900 ${
              !isOnline 
                ? 'bg-amber-500' 
                : status.state === 'connected' 
                ? 'bg-emerald-400 animate-ping-slow' 
                : 'bg-rose-500'
            }`} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-sm tracking-wide text-white truncate">
                {t.appName}
              </h1>
              {isSimulated && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-medium whitespace-nowrap">
                  Demo
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              {!isOnline ? (
                <span className="flex items-center gap-1 text-amber-400">
                  <WifiOff className="w-3 h-3" /> {t.offline}
                </span>
              ) : status.state === 'connected' ? (
                <span className="flex items-center gap-1 text-emerald-400 font-mono">
                  <Wifi className="w-3 h-3" />
                  <span className="text-slate-300">{status.latencyMs}ms</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-cyan-400 capitalize">{status.modeUsed}</span>
                </span>
              ) : status.state === 'connecting' ? (
                <span className="flex items-center gap-1 text-sky-400">
                  <RefreshCw className="w-3 h-3 animate-spin" /> {t.connecting}
                </span>
              ) : (
                <span className="text-rose-400">{t.offline}</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Sound Alert Toggle */}
          <button
            onClick={() => {
              triggerHaptic(30);
              onToggleSound();
            }}
            title={soundEnabled ? t.soundOn : t.soundOff}
            className={`p-2 rounded-lg transition text-xs flex items-center justify-center ${
              soundEnabled 
                ? 'bg-slate-800 text-cyan-400 border border-cyan-500/30 hover:bg-slate-700' 
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Language Toggle */}
          <button
            onClick={() => {
              triggerHaptic(30);
              onToggleLanguage();
            }}
            title="Language"
            className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-xs font-semibold text-slate-200 transition flex items-center gap-1"
          >
            <Languages className="w-3.5 h-3.5 text-cyan-400" />
            <span>{language === 'bn' ? 'বাংলা' : 'EN'}</span>
          </button>

          {/* PWA Install Button */}
          {!isInstalled ? (
            <button
              onClick={handleInstallClick}
              title={t.installApp}
              className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-medium shadow-sm transition flex items-center gap-1.5 animate-pulse"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.installApp}</span>
            </button>
          ) : (
            <span className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-1 rounded-lg">
              <CheckCircle2 className="w-3 h-3" />
              <span>{t.installedOnPhone}</span>
            </span>
          )}

          {/* Manual Refresh Button */}
          <button
            onClick={() => {
              triggerHaptic(40);
              onRefresh();
            }}
            disabled={isRefreshing}
            title={t.syncNow}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-200 transition disabled:opacity-50 flex items-center justify-center"
          >
            <RefreshCw className={`w-4 h-4 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
