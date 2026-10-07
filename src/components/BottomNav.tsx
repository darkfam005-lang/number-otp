import React from 'react';
import { 
  Inbox, 
  BarChart3, 
  Send, 
  Users, 
  Settings 
} from 'lucide-react';
import { SupportedLanguage } from '../types/lamix';
import { getTranslation } from '../utils/translations';
import { triggerHaptic } from '../utils/audioHaptics';

export type TabId = 'messages' | 'analytics' | 'send' | 'contacts' | 'settings';

interface BottomNavProps {
  activeTab: TabId;
  onChangeTab: (tab: TabId) => void;
  language: SupportedLanguage;
  unreadCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  language,
  unreadCount = 0,
}) => {
  const t = getTranslation(language);

  const tabs: Array<{ id: TabId; label: string; icon: React.ElementType; badge?: number }> = [
    { id: 'messages', label: t.navMessages, icon: Inbox, badge: unreadCount },
    { id: 'analytics', label: t.navAnalytics, icon: BarChart3 },
    { id: 'send', label: t.navSend, icon: Send },
    { id: 'contacts', label: t.navContacts, icon: Users },
    { id: 'settings', label: t.navSettings, icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-md mx-auto grid grid-cols-5 px-1 py-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic(25);
                onChangeTab(tab.id);
              }}
              className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition duration-150 ${
                isActive
                  ? 'text-cyan-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-cyan-400' : ''}`} />
                {typeof tab.badge === 'number' && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-extrabold flex items-center justify-center shadow-sm">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 truncate max-w-full tracking-tight ${
                isActive ? 'text-cyan-300' : 'text-slate-400'
              }`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-6 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
