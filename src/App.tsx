/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LamixConfig, LamixMessage, ConnectionStatus, SupportedLanguage } from './types/lamix';
import { 
  DEFAULT_CONFIG, 
  loadSavedConfig, 
  saveConfig, 
  fetchLamixMessages 
} from './services/lamixApi';
import { useOnlineStatus } from './hooks/usePWAInstall';
import { playSmsChime, triggerHaptic } from './utils/audioHaptics';
import { TopHeader } from './components/TopHeader';
import { BottomNav, TabId } from './components/BottomNav';
import { MessagesTab } from './components/tabs/MessagesTab';
import { AnalyticsTab } from './components/tabs/AnalyticsTab';
import { SendSmsTab } from './components/tabs/SendSmsTab';
import { ContactsTab } from './components/tabs/ContactsTab';
import { SettingsTab } from './components/tabs/SettingsTab';
import { InstallModal } from './components/InstallModal';
import { WifiOff } from 'lucide-react';
import { getTranslation } from './utils/translations';

export default function App() {
  const [config, setConfig] = useState<LamixConfig>(loadSavedConfig);
  const [activeTab, setActiveTab] = useState<TabId>('messages');
  const [messages, setMessages] = useState<LamixMessage[]>([]);
  const [isSimulated, setIsSimulated] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [prefilledSendRecipient, setPrefilledSendRecipient] = useState<string>('');
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    state: 'connecting',
    modeUsed: 'direct',
    latencyMs: 0,
    lastSyncTime: null,
    recordCount: 0,
  });

  const isOnline = useOnlineStatus();
  const knownMessageIdsRef = useRef<Set<string | number>>(new Set());
  const initialLoadDoneRef = useRef(false);

  // Sync / Fetch function
  const loadMessages = useCallback(async (isManual = false) => {
    if (isManual) {
      setIsRefreshing(true);
    }

    try {
      const result = await fetchLamixMessages(config);
      
      // Detect newly received messages
      if (initialLoadDoneRef.current && result.messages.length > 0) {
        const newItems = result.messages.filter(
          (m) => !knownMessageIdsRef.current.has(m.id)
        );

        if (newItems.length > 0) {
          // Play notification chime and haptics for new message arrivals
          if (config.audioNotification) {
            playSmsChime();
          }
          if (config.vibrationNotification) {
            triggerHaptic([100, 60, 100]);
          }
        }
      }

      // Update known ID set
      const idSet = new Set(result.messages.map((m) => m.id));
      knownMessageIdsRef.current = idSet;
      initialLoadDoneRef.current = true;

      setMessages(result.messages);
      setIsSimulated(result.isSimulated);
      setConnectionStatus(result.status);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Fetch failed';
      setConnectionStatus((prev) => ({
        ...prev,
        state: 'error',
        errorMessage: errorMsg,
      }));
    } finally {
      setIsRefreshing(false);
    }
  }, [config]);

  // Initial fetch on mount & whenever config changes
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Background Auto-Refresh interval
  useEffect(() => {
    if (!config.autoRefresh || config.refreshInterval <= 0) return;

    const intervalMs = Math.max(5, config.refreshInterval) * 1000;
    const timer = setInterval(() => {
      loadMessages();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [config.autoRefresh, config.refreshInterval, loadMessages]);

  // Save config changes
  const handleSaveConfig = (newConfig: LamixConfig) => {
    setConfig(newConfig);
    saveConfig(newConfig);
    loadMessages(true);
  };

  const handleToggleSound = () => {
    const updated = { ...config, audioNotification: !config.audioNotification };
    setConfig(updated);
    saveConfig(updated);
  };

  const handleToggleLanguage = () => {
    const newLang: SupportedLanguage = config.language === 'bn' ? 'en' : 'bn';
    const updated = { ...config, language: newLang };
    setConfig(updated);
    saveConfig(updated);
  };

  // Switch to send tab with contact
  const handleSelectContactForSend = (phone: string) => {
    setPrefilledSendRecipient(phone);
    setActiveTab('send');
  };

  const t = getTranslation(config.language);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top Mobile Header */}
      <TopHeader
        status={connectionStatus}
        isOnline={isOnline}
        language={config.language}
        soundEnabled={config.audioNotification}
        isRefreshing={isRefreshing}
        isSimulated={isSimulated}
        onToggleSound={handleToggleSound}
        onToggleLanguage={handleToggleLanguage}
        onRefresh={() => loadMessages(true)}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-lg w-full mx-auto px-3.5 pt-3">
        {activeTab === 'messages' && (
          <MessagesTab
            messages={messages}
            language={config.language}
            isSimulated={isSimulated}
            onRefresh={() => loadMessages(true)}
            onOpenInstallModal={() => setIsInstallModalOpen(true)}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab
            messages={messages}
            config={config}
            language={config.language}
          />
        )}

        {activeTab === 'send' && (
          <SendSmsTab
            config={config}
            language={config.language}
            initialRecipient={prefilledSendRecipient}
          />
        )}

        {activeTab === 'contacts' && (
          <ContactsTab
            language={config.language}
            onSelectContactForSend={handleSelectContactForSend}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            config={config}
            language={config.language}
            onSaveConfig={handleSaveConfig}
            onOpenInstallModal={() => setIsInstallModalOpen(true)}
          />
        )}
      </main>

      {/* Android Installation Modal */}
      <InstallModal
        isOpen={isInstallModalOpen}
        language={config.language}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {/* Offline Toast if device is offline */}
      {!isOnline && (
        <div className="fixed bottom-16 left-4 right-4 max-w-sm mx-auto z-50 bg-amber-500 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xl flex items-center gap-2 animate-bounce">
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          <span>{t.offlineNotice}</span>
        </div>
      )}

      {/* Bottom Mobile Tab Bar */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        language={config.language}
        unreadCount={messages.filter((m) => m.status === 'pending').length}
      />
    </div>
  );
}
