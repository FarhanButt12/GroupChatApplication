'use client';

import React, { useState, useEffect } from 'react';

export interface Group {
  id: string;
  name: string;
  description?: string;
  _count?: {
    members?: number;
    messages?: number;
  };
}

interface GroupSelectorProps {
  token: string;
  onSelectGroup: (group: Group) => void;
  selectedGroupId?: string;
  apiUrl?: string;
}

export const GroupSelector: React.FC<GroupSelectorProps> = ({
  token,
  onSelectGroup,
  selectedGroupId,
  apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
}) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch(`${apiUrl}/groups`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch groups');
        }

        const result = await response.json();
        const groupList: Group[] = result.groups || result.data || (Array.isArray(result) ? result : []);
        setGroups(groupList);

        // Auto-select first group if none selected
        if (groupList.length > 0 && !selectedGroupId) {
          onSelectGroup(groupList[0]);
        }
      } catch (err: any) {
        setError(err.message || 'Error loading groups');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchGroups();
    }
  }, [token, apiUrl]);

  if (loading) {
    return (
      <div className="flex gap-2 animate-pulse py-2">
        <div className="h-10 w-28 bg-slate-800/80 rounded-xl"></div>
        <div className="h-10 w-32 bg-slate-800/80 rounded-xl"></div>
        <div className="h-10 w-24 bg-slate-800/80 rounded-xl"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-xs text-red-400 py-1.5">⚠️ {error}</div>;
  }

  if (groups.length === 0) {
    return <div className="text-xs text-slate-400 py-2">No groups available in database.</div>;
  }

  return (
    <div className="flex gap-2.5 overflow-x-auto py-1.5 no-scrollbar">
      {groups.map((group) => {
        const isSelected = group.id === selectedGroupId;
        return (
          <button
            key={group.id}
            onClick={() => onSelectGroup(group)}
            className={`px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
              isSelected
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-500 scale-[1.02]'
                : 'bg-slate-900/90 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-800/90'
            }`}
          >
            <span className={isSelected ? 'text-indigo-200 font-extrabold' : 'text-slate-500'}>#</span>
            <span>{group.name}</span>
          </button>
        );
      })}
    </div>
  );
};
