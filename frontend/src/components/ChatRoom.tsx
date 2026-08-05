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
  onRequestLogout?: () => void;
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
  onRequestLogout,
  apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [msgFilter, setMsgFilter] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickEmojis = ['👍', '❤️', '🔥', '🚀', '😂', '🎉', '💯', '🙏'];

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

  const appendEmoji = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
  };

  const getInitials = (name: string) => {
    return (name || 'U').substring(0, 2).toUpperCase();
  };

  const filteredMessages = messages.filter((msg) =>
    msg.content.toLowerCase().includes(msgFilter.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center gap-4 glass-main text-slate-400 select-none">
        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="text-xs font-bold tracking-wide">Connecting to #{groupName}...</p>
      </div>
    );
  }

  // Non-member Locked State Screen
  if (!isMember) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center p-8 text-center glass-main relative select-none overflow-hidden">
        <div className="relative z-10 max-w-md space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-4xl shadow-2xl mx-auto">
            🔒
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
              <span>#{groupName}</span>
              <span className="text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                Locked Channel
              </span>
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              You are currently not a member of this channel. Join to unlock message history and participate in conversations.
            </p>
            {groupDescription && (
              <p className="text-xs text-blue-400 bg-blue-500/10 py-2.5 px-4 rounded-xl border border-blue-500/20 italic mt-2">
                "{groupDescription}"
              </p>
            )}
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
              ⚠️ {error}
            </div>
          )}

          <button
            onClick={handleJoinGroup}
            className="w-full py-3.5 gradient-btn text-white font-extrabold text-xs rounded-xl shadow-xl flex items-center justify-center gap-2"
          >
            <span>➕ Join Channel</span>
          </button>
        </div>
      </div>
    );
  }

  // Active Member Live Chat Stream
  return (
    <div className="flex-1 flex flex-col h-full glass-main overflow-hidden">
      {/* Channel Header Navigation Bar */}
      <header className="px-6 py-3.5 border-b border-slate-800/80 bg-slate-950/70 flex justify-between items-center shrink-0 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-extrabold text-blue-400 text-lg">
            #
          </div>
          <div>
            <h2 className="font-extrabold text-white text-sm tracking-tight flex items-center gap-2">
              <span>{groupName}</span>
              <span className="text-xs" title="Joined Channel">🔓</span>
            </h2>
            {groupDescription && (
              <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">{groupDescription}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-2 rounded-xl text-xs transition-all border ${
              showSearch
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
            }`}
            title="Search Messages"
          >
            🔍
          </button>

          <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            10s Sync
          </span>

          <button
            onClick={() => refetch()}
            title="Sync Messages"
            className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all text-xs"
          >
            🔄
          </button>

          {onRequestLogout && (
            <button
              onClick={onRequestLogout}
              className="px-3 py-1.5 bg-slate-900 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-800 hover:border-rose-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <span>🚪</span>
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          )}
        </div>
      </header>

      {/* Filter Bar */}
      {showSearch && (
        <div className="px-6 py-2 bg-slate-950/90 border-b border-slate-800/80 flex items-center gap-2">
          <span className="text-slate-500 text-xs">🔍</span>
          <input
            type="text"
            value={msgFilter}
            onChange={(e) => setMsgFilter(e.target.value)}
            placeholder="Filter messages in this channel..."
            className="flex-1 bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          {msgFilter && (
            <button
              onClick={() => setMsgFilter('')}
              className="text-xs text-slate-500 hover:text-white"
            >
              ✕ Clear
            </button>
          )}
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="p-2.5 bg-rose-500/10 border-b border-rose-500/20 text-rose-400 text-xs text-center">
          ⚠️ {error}
        </div>
      )}

      {/* Messages Feed */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 select-none">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl shadow-inner">
              💬
            </div>
            <p className="text-xs font-bold text-slate-400">
              {msgFilter ? 'No matching messages found' : `No messages in #${groupName} yet.`}
            </p>
          </div>
        ) : (
          filteredMessages.map((msg) => {
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
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 shadow-md ${
                    isMine
                      ? 'gradient-btn text-white'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {getInitials(displaySender)}
                </div>

                <div className={`flex flex-col max-w-[75%] ${isMine ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold text-slate-400">
                      {displaySender}
                    </span>
                    <span className="text-[10px] text-slate-600">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div
                    className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-md break-words ${
                      isMine
                        ? 'gradient-btn text-white rounded-tr-none'
                        : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none'
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

      {/* Message Input Footer */}
      <footer className="p-4 border-t border-slate-800/80 bg-slate-950/90 shrink-0 space-y-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pr-1">Quick:</span>
          {quickEmojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => appendEmoji(emoji)}
              className="p-1 px-2 text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition-all hover:scale-110"
            >
              {emoji}
            </button>
          ))}
        </div>

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message #${groupName}...`}
            disabled={sending}
            className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="px-6 py-3 gradient-btn text-white font-extrabold text-xs rounded-xl disabled:opacity-40 transition-all shadow-lg flex items-center gap-1.5 shrink-0"
          >
            {sending ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Send 🚀</>
            )}
          </button>
        </form>
        {sendError && (
          <div className="mt-1.5 text-rose-400 text-[11px] text-center">{sendError}</div>
        )}
      </footer>
    </div>
  );
};
