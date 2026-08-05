'use client';

import React, { useState, useEffect, useCallback } from 'react';

export interface GroupMemberInfo {
  userId: string;
  role?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  members?: GroupMemberInfo[];
  _count?: {
    members?: number;
    messages?: number;
  };
}

interface SidebarProps {
  token: string;
  currentUser: { id: string; username: string; email: string };
  selectedGroup: Group | null;
  onSelectGroup: (group: Group) => void;
  onRequestLogout: () => void;
  currentTheme: string;
  onThemeChange: (theme: string) => void;
  apiUrl?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  token,
  currentUser,
  selectedGroup,
  onSelectGroup,
  onRequestLogout,
  currentTheme,
  onThemeChange,
  apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
}) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'joined' | 'locked'>('all');
  const [userStatus, setUserStatus] = useState<'online' | 'focus' | 'away'>('online');
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/groups`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const list: Group[] = data.groups || data.data || (Array.isArray(data) ? data : []);
        setGroups(list);
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
    } finally {
      setLoading(false);
    }
  }, [token, apiUrl]);

  useEffect(() => {
    if (token) fetchGroups();
  }, [token, fetchGroups]);

  const filteredGroups = groups.filter((group) => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase());
    const isJoined = group.members?.some((m) => m.userId === currentUser.id);

    if (!matchesSearch) return false;
    if (filterMode === 'joined') return isJoined;
    if (filterMode === 'locked') return !isJoined;
    return true;
  });

  const getInitials = (name: string) => {
    return (name || 'U').substring(0, 2).toUpperCase();
  };

  const themes = [
    { id: 'default', color: 'bg-blue-600', name: 'Obsidian Blue' },
    { id: 'stealth-cyber', color: 'bg-cyan-500', name: 'Stealth Cyber' },
    { id: 'titanium-emerald', color: 'bg-emerald-500', name: 'Titanium Emerald' },
    { id: 'monochrome-onyx', color: 'bg-slate-400', name: 'Monochrome Onyx' },
  ];

  return (
    <aside className="w-72 sm:w-80 glass-sidebar flex flex-col h-full shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl gradient-btn flex items-center justify-center font-black text-white text-lg shadow-lg">
              ⚡
            </div>
            <div>
              <h1 className="font-extrabold text-base text-white tracking-tight leading-none flex items-center gap-1.5">
                SYNAPSE <span className="text-[10px] text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">HQ</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">Enterprise Communications</p>
            </div>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" title="System Connected"></span>
        </div>

        {/* Executive Palette Theme Selector */}
        <div className="flex items-center justify-between bg-slate-950/80 p-2 rounded-xl border border-slate-800/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Palette:</span>
          <div className="flex items-center gap-2">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => onThemeChange(t.id)}
                title={t.name}
                className={`w-4 h-4 rounded-md ${t.color} transition-all duration-200 ${
                  currentTheme === t.id ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-110' : 'opacity-50 hover:opacity-100'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Search & Channel Filters */}
      <div className="p-3 space-y-2.5">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter channels..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
          />
          <span className="absolute left-3 top-2.5 text-slate-500 text-xs">🔍</span>
        </div>

        {/* Filter Pills */}
        <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 text-[11px] font-bold">
          <button
            onClick={() => setFilterMode('all')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              filterMode === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({groups.length})
          </button>
          <button
            onClick={() => setFilterMode('joined')}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
              filterMode === 'joined'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🔓 Joined
          </button>
          <button
            onClick={() => setFilterMode('locked')}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
              filterMode === 'locked'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🔒 Locked
          </button>
        </div>
      </div>

      {/* Channel Header */}
      <div className="px-4 py-1 flex justify-between items-center text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
        <span>Workspace Channels</span>
        <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded font-bold">
          {filteredGroups.length}
        </span>
      </div>

      {/* Channel List */}
      <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1.5">
        {loading ? (
          <div className="p-4 space-y-2">
            <div className="h-10 bg-slate-800/40 rounded-xl animate-pulse"></div>
            <div className="h-10 bg-slate-800/40 rounded-xl animate-pulse"></div>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">No channels found</div>
        ) : (
          filteredGroups.map((group) => {
            const isSelected = selectedGroup?.id === group.id;
            const isJoined = group.members?.some((m) => m.userId === currentUser.id);

            return (
              <button
                key={group.id}
                onClick={() => onSelectGroup(group)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all duration-150 ${
                  isSelected
                    ? 'channel-card-active'
                    : 'channel-card-inactive'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className={`text-sm ${isSelected ? 'text-blue-400 font-black' : 'text-slate-500'}`}>
                    #
                  </span>
                  <span className="truncate">{group.name}</span>
                  <span className="text-xs shrink-0" title={isJoined ? 'Joined (Unlocked)' : 'Not Joined (Locked)'}>
                    {isJoined ? '🔓' : '🔒'}
                  </span>
                </div>

                {group._count?.messages !== undefined && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                      isSelected
                        ? 'bg-slate-950/80 text-blue-300 border border-blue-500/30'
                        : 'bg-slate-950 text-slate-500 border border-slate-800'
                    }`}
                  >
                    {group._count.messages}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* User Footer Profile & Sign Out Request */}
      <div className="p-3.5 bg-slate-950/90 border-t border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 truncate">
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-white text-xs">
                {getInitials(currentUser.username)}
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${
                  userStatus === 'online'
                    ? 'bg-emerald-400'
                    : userStatus === 'focus'
                    ? 'bg-amber-400'
                    : 'bg-slate-500'
                }`}
              />
            </div>
            <div className="truncate text-left">
              <p className="text-xs font-bold text-white truncate leading-tight">
                {currentUser.username}
              </p>
              <p className="text-[10px] text-slate-400 truncate leading-tight">
                {currentUser.email}
              </p>
            </div>
          </div>

          <select
            value={userStatus}
            onChange={(e) => setUserStatus(e.target.value as any)}
            className="bg-slate-900 text-[10px] font-bold text-slate-300 border border-slate-800 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="online">🟢 Online</option>
            <option value="focus">🌙 Focus</option>
            <option value="away">⚪ Away</option>
          </select>
        </div>

        {/* Triggers Confirmation Modal */}
        <button
          onClick={onRequestLogout}
          className="w-full py-2.5 bg-slate-900 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-800 hover:border-rose-500/30 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2"
        >
          <span>🚪</span>
          <span>Sign Out Account</span>
        </button>
      </div>
    </aside>
  );
};
