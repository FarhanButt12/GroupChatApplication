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
  onLogout: () => void;
  apiUrl?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  token,
  currentUser,
  selectedGroup,
  onSelectGroup,
  onLogout,
  apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
}) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
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
        // DO NOT auto-select the first group on login per user requirement!
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

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getInitials = (name: string) => {
    return (name || 'U').substring(0, 2).toUpperCase();
  };

  return (
    <aside className="w-64 sm:w-72 sidebar-bg flex flex-col h-full shrink-0 border-r border-slate-800/80 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/30">
            💬
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-white tracking-tight leading-none">
              GroupChat
            </h1>
            <span className="text-[10px] text-slate-400 font-semibold">Team Workspace</span>
          </div>
        </div>
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="System Online"></span>
      </div>

      {/* Search Bar */}
      <div className="p-3">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search channels..."
            className="w-full pl-8 pr-3 py-2 bg-slate-950/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
          />
          <span className="absolute left-2.5 top-2.5 text-slate-500 text-xs">🔍</span>
        </div>
      </div>

      {/* Channels List Header */}
      <div className="px-4 py-2 flex justify-between items-center text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
        <span>Channels</span>
        <span className="text-[10px] bg-slate-800/90 text-slate-300 px-2 py-0.5 rounded-md font-bold">
          {groups.length}
        </span>
      </div>

      {/* Channels Navigation List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {loading ? (
          <div className="p-4 space-y-2">
            <div className="h-9 bg-slate-800/40 rounded-xl animate-pulse"></div>
            <div className="h-9 bg-slate-800/40 rounded-xl animate-pulse"></div>
            <div className="h-9 bg-slate-800/40 rounded-xl animate-pulse"></div>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="p-4 text-xs text-slate-500 text-center">No channels found</div>
        ) : (
          filteredGroups.map((group) => {
            const isSelected = selectedGroup?.id === group.id;
            const isJoined = group.members?.some((m) => m.userId === currentUser.id);

            return (
              <button
                key={group.id}
                onClick={() => onSelectGroup(group)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all duration-150 group ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className={`text-sm ${isSelected ? 'text-indigo-200 font-black' : 'text-slate-600 group-hover:text-slate-400'}`}>
                    #
                  </span>
                  <span className="truncate">{group.name}</span>
                  {/* Lock / Unlock Icon showing membership status */}
                  <span
                    className="text-xs shrink-0"
                    title={isJoined ? 'Joined (Unlocked)' : 'Not Joined (Locked)'}
                  >
                    {isJoined ? '🔓' : '🔒'}
                  </span>
                </div>

                {group._count?.messages !== undefined && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}>
                    {group._count.messages}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* User Profile & Sign Out */}
      <div className="p-3.5 bg-slate-950/80 border-t border-slate-800/80 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-md">
            {getInitials(currentUser.username)}
          </div>
          <div className="truncate text-left flex-1">
            <p className="text-xs font-bold text-white truncate leading-tight">
              {currentUser.username}
            </p>
            <p className="text-[10px] text-slate-400 truncate leading-tight">
              {currentUser.email}
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full py-2 bg-slate-900 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-slate-800 hover:border-red-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <span>🚪</span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
