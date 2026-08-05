'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useMessagePolling } from '../hooks/useMessagePolling';

interface ChatRoomProps {
  groupId: string;
  groupName: string;
  groupDescription?: string;
  token: string;
  currentUserId: string;
  currentUsername: string;
  onJoined?: () => void;
  onLogout?: () => void;
  apiUrl?: string;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({
  groupId,
  groupName,
  groupDescription,
  token,
  currentUserId,
  currentUsername,
  onJoined,
  onLogout,
  apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, loading, isMember, error, joinGroup, refetch } = useMessagePolling({
    groupId,
    token,
    intervalMs: 10000,
    apiUrl,
  });

  useEffect(() => {
    if (isMember) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMember]);

  const handleJoinGroup = async () => {
    await joinGroup();
    onJoined?.();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    setSendError(null);

    try {
      const response = await fetch(`${apiUrl}/groups/${groupId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          Array.isArray(errorData.message)
            ? errorData.message.join(', ')
            : errorData.message || 'Failed to send message',
        );
      }

      setNewMessage('');
      await refetch();
    } catch (err: any) {
      setSendError(err.message || 'Error sending message');
    } finally {
      setSending(false);
    }
  };

  const getInitials = (name: string) => {
    return (name || 'U').substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center gap-3 chat-bg text-slate-500">
        <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="text-xs font-medium">Connecting to #{groupName}...</p>
      </div>
    );
  }

  // Non-member Locked State View
  if (!isMember) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center p-8 text-center chat-bg relative select-none">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-3xl shadow-xl mb-4">
          🔒
        </div>

        <div className="max-w-sm space-y-2 mb-6">
          <h2 className="text-xl font-bold text-white tracking-tight">
            #{groupName}
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            You are not a member of this channel. Join to view message history and start chatting.
          </p>
          {groupDescription && (
            <p className="text-[11px] text-indigo-400 bg-indigo-500/10 py-2 px-3 rounded-lg border border-indigo-500/20 italic">
              "{groupDescription}"
            </p>
          )}
        </div>

        {error && (
          <div className="mb-4 p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
            {error}
          </div>
        )}

        <button
          onClick={handleJoinGroup}
          className="px-6 py-2.5 btn-primary text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2"
        >
          <span>Join Channel</span>
        </button>
      </div>
    );
  }

  // Active Member Chat Stream
  return (
    <div className="flex-1 flex flex-col h-full chat-bg overflow-hidden">
      {/* Top Header Bar */}
      <header className="px-6 py-3.5 border-b border-slate-800/80 bg-slate-900/40 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg font-extrabold text-indigo-400">#</span>
          <div>
            <h2 className="font-bold text-white text-sm tracking-tight flex items-center gap-1.5">
              <span>{groupName}</span>
              <span className="text-xs" title="Joined Channel">🔓</span>
            </h2>
            {groupDescription && (
              <p className="text-[11px] text-slate-400 truncate max-w-md">{groupDescription}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Live
          </span>

          <button
            onClick={() => refetch()}
            title="Sync Messages"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all text-xs"
          >
            🔄
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className="px-3 py-1.5 bg-slate-900 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-slate-800 hover:border-red-500/30 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <span>🚪</span>
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          )}
        </div>
      </header>

      {/* Error alert */}
      {error && (
        <div className="p-2.5 bg-red-500/10 border-b border-red-500/20 text-red-400 text-xs text-center">
          {error}
        </div>
      )}

      {/* Messages Feed */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
            <div className="text-3xl">💬</div>
            <p className="text-xs font-medium">No messages in #{groupName} yet.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === currentUserId;
            const displaySender = isMine
              ? currentUsername
              : msg.sender?.username || 'Member';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* User Avatar */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    isMine
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {getInitials(displaySender)}
                </div>

                <div className={`flex flex-col max-w-[70%] ${isMine ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-semibold text-slate-400">
                      {displaySender}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div
                    className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm break-words ${
                      isMine
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-slate-800 text-slate-200 border border-slate-700/70 rounded-tl-none'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Bar */}
      <footer className="p-4 border-t border-slate-800/80 bg-slate-900/30 shrink-0">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message #${groupName}...`}
            disabled={sending}
            className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="px-5 py-2.5 btn-primary text-white font-bold text-xs rounded-xl disabled:opacity-40 transition-all flex items-center gap-1.5"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
        {sendError && (
          <div className="mt-2 text-red-400 text-[11px] text-center">{sendError}</div>
        )}
      </footer>
    </div>
  );
};
