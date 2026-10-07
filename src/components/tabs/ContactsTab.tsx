import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Phone, 
  Send, 
  Trash2, 
  Search, 
  Plus, 
  Check, 
  X,
  FileSpreadsheet
} from 'lucide-react';
import { Contact, SupportedLanguage } from '../../types/lamix';
import { getTranslation } from '../../utils/translations';
import { triggerHaptic } from '../../utils/audioHaptics';

interface ContactsTabProps {
  language: SupportedLanguage;
  onSelectContactForSend: (phone: string) => void;
}

const STORAGE_KEY = 'lamix_mobile_contacts_v1';

const INITIAL_CONTACTS: Contact[] = [
  { id: 'c1', name: 'Al-Amin Test SIM 1', phone: '+8801712984512', group: 'Test SIMs', createdAt: new Date().toISOString() },
  { id: 'c2', name: 'Office Backup SIM 2', phone: '+8801823451980', group: 'Test SIMs', createdAt: new Date().toISOString() },
  { id: 'c3', name: 'OTP Verification Line', phone: '+8801934567890', group: 'OTP Testing', createdAt: new Date().toISOString() },
];

export const ContactsTab: React.FC<ContactsTabProps> = ({
  language,
  onSelectContactForSend,
}) => {
  const t = getTranslation(language);
  const [contacts, setContacts] = useState<Contact[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : INITIAL_CONTACTS;
    } catch {
      return INITIAL_CONTACTS;
    }
  });

  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [isAdding, setIsAdding] = useState(false);

  // New Contact form states
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newGroup, setNewGroup] = useState('Default');

  // Save on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
    } catch {
      // ignore
    }
  }, [contacts]);

  // Unique groups
  const groups = Array.from(new Set(contacts.map((c) => c.group || 'Default')));

  // Filtered contacts
  const filtered = contacts.filter((c) => {
    if (selectedGroup !== 'all' && c.group !== selectedGroup) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.includes(q);
  });

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhone.trim()) return;

    triggerHaptic(30);
    const item: Contact = {
      id: `c-${Date.now()}`,
      name: newName.trim() || 'Unnamed Contact',
      phone: newPhone.trim(),
      group: newGroup.trim() || 'Default',
      createdAt: new Date().toISOString(),
    };

    setContacts([item, ...contacts]);
    setNewName('');
    setNewPhone('');
    setIsAdding(false);
  };

  const handleDeleteContact = (id: string) => {
    triggerHaptic(30);
    setContacts(contacts.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-3.5 pb-20">
      {/* Header bar */}
      <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <span>{t.contactsTitle}</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {contacts.length} saved numbers
          </span>
        </div>

        <button
          onClick={() => {
            triggerHaptic(20);
            setIsAdding(!isAdding);
          }}
          className="py-1.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-sm shadow-cyan-500/20"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>{t.addContact}</span>
        </button>
      </div>

      {/* Add Contact Modal / Inline Form */}
      {isAdding && (
        <form
          onSubmit={handleAddContact}
          className="bg-slate-900 p-4 rounded-2xl border border-cyan-500/30 space-y-3 shadow-lg animate-in fade-in"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">{t.addContact}</h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="block text-xs text-slate-300 mb-1">{t.name}</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. VIP Customer"
              className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-300 mb-1">{t.phone} *</label>
            <input
              type="tel"
              required
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="e.g. +8801700000000"
              className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-300 mb-1">{t.group}</label>
            <input
              type="text"
              value={newGroup}
              onChange={(e) => setNewGroup(e.target.value)}
              placeholder="e.g. VIP, Test SIMs, Clients"
              className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition"
            >
              Save Contact
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Search and Group Filter */}
      <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or phone..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Group Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          <button
            onClick={() => setSelectedGroup('all')}
            className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition ${
              selectedGroup === 'all'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'bg-slate-950 text-slate-400 border border-slate-800'
            }`}
          >
            {t.allGroups}
          </button>
          {groups.map((grp) => (
            <button
              key={grp}
              onClick={() => setSelectedGroup(grp)}
              className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                selectedGroup === grp
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-950 text-slate-400 border border-slate-800'
              }`}
            >
              {grp}
            </button>
          ))}
        </div>
      </div>

      {/* Contact List */}
      <div className="space-y-2">
        {filtered.map((c) => (
          <div
            key={c.id}
            className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800/80 flex items-center justify-between gap-3 shadow-sm"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-white truncate">{c.name}</h4>
                <span className="text-[10px] bg-slate-950 text-slate-400 border border-slate-800 px-1.5 py-0.2 rounded font-medium">
                  {c.group}
                </span>
              </div>
              <p className="text-xs font-mono text-cyan-400 font-medium mt-0.5 tracking-tight truncate">
                {c.phone}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  triggerHaptic(30);
                  onSelectContactForSend(c.phone);
                }}
                title={t.quickSend}
                className="p-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 transition border border-cyan-500/30"
              >
                <Send className="w-3.5 h-3.5" />
              </button>

              <a
                href={`tel:${c.phone}`}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                title="Call"
              >
                <Phone className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => handleDeleteContact(c.id)}
                className="p-2 rounded-xl bg-slate-800/60 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition"
                title={t.delete}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
