'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMessageSocket, Message } from '../hooks/useMessageSocket';

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
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isNearBottomRef = useRef<boolean>(true);
  const prevGroupIdRef = useRef<string>(groupId);

  const quickEmojis = ['👍', '❤️', '🔥', '🚀', '😂', '🎉', '💯', '🙏'];

  const {
    messages,
    loading,
    isMember,
    error,
    isConnected,
    onlineUsers,
    typingUsers,
    emitTypingStart,
    emitTypingStop,
    joinGroup,
    refetch,
  } = useMessageSocket({
    groupId,
    token,
    apiUrl,
  });

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 150;
    }
  };

  // Smart Auto-Scroll logic
  useEffect(() => {
    if (!isMember) return;

    const isGroupChanged = prevGroupIdRef.current !== groupId;
    if (isGroupChanged) {
      prevGroupIdRef.current = groupId;
      isNearBottomRef.current = true;
    }

    if (isNearBottomRef.current || isGroupChanged) {
      messagesEndRef.current?.scrollIntoView({ behavior: isGroupChanged ? 'auto' : 'smooth' });
    }
  }, [messages, isMember, groupId]);

  // Mark latest messages as read
  useEffect(() => {
    if (isMember && messages.length > 0 && token) {
      const unreadMessages = messages.filter(
        (m) =>
          m.senderId !== currentUserId &&
          !m.readReceipts?.some((r) => r.userId === currentUserId),
      );

      unreadMessages.slice(-3).forEach((msg) => {
        fetch(`${apiUrl}/groups/${groupId}/messages/${msg.id}/read`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).catch(() => {});
      });
    }
  }, [messages, isMember, currentUserId, groupId, token, apiUrl]);

  const handleJoinGroup = async () => {
    await joinGroup();
    onJoined?.();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    emitTypingStart();

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      emitTypingStop();
    }, 1500);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    emitTypingStop();
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
      isNearBottomRef.current = true;
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err: any) {
      setSendError(err.message || 'Error sending message');
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSending(true);
    setSendError(null);

    const formData = new FormData();
    formData.append('file', file);
    if (newMessage.trim()) {
      formData.append('content', newMessage.trim());
    }

    try {
      const response = await fetch(`${apiUrl}/groups/${groupId}/messages/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload file');
      }

      setNewMessage('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      isNearBottomRef.current = true;
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err: any) {
      setSendError(err.message || 'Error uploading file');
    } finally {
      setSending(false);
    }
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    try {
      await fetch(`${apiUrl}/groups/${groupId}/messages/${messageId}/react`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ emoji }),
      });
    } catch (err) {
      console.error('Failed to toggle reaction', err);
    }
  };

  const handleStartEdit = (msg: Message) => {
    setEditingMessageId(msg.id);
    setEditContent(msg.content);
  };

  const handleSaveEdit = async (messageId: string) => {
    if (!editContent.trim()) return;

    try {
      const response = await fetch(`${apiUrl}/groups/${groupId}/messages/${messageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: editContent.trim() }),
      });

      if (response.ok) {
        setEditingMessageId(null);
        setEditContent('');
      }
    } catch (err) {
      console.error('Failed to edit message', err);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      await fetch(`${apiUrl}/groups/${groupId}/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error('Failed to delete message', err);
    }
  };

  const appendEmoji = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
  };

  const getInitials = (name: string) => {
    return (name || 'U').substring(0, 2).toUpperCase();
  };

  const getAvatarGradient = (username: string) => {
    if (!username) return 'from-slate-700 to-slate-900 border-slate-700 text-slate-200';
    const gradients = [
      'bg-gradient-to-br from-blue-600 to-indigo-700 border-blue-400/40 text-white shadow-blue-500/20',
      'bg-gradient-to-br from-emerald-500 to-teal-700 border-emerald-400/40 text-white shadow-emerald-500/20',
      'bg-gradient-to-br from-violet-600 to-purple-800 border-purple-400/40 text-white shadow-purple-500/20',
      'bg-gradient-to-br from-amber-500 to-orange-700 border-amber-400/40 text-white shadow-amber-500/20',
      'bg-gradient-to-br from-cyan-500 to-blue-700 border-cyan-400/40 text-white shadow-cyan-500/20',
      'bg-gradient-to-br from-rose-500 to-pink-700 border-rose-400/40 text-white shadow-rose-500/20',
    ];
    let sum = 0;
    for (let i = 0; i < username.length; i++) {
      sum += username.charCodeAt(i);
    }
    return gradients[sum % gradients.length];
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

  const getChannelIconBadge = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('design') || lower.includes('ux')) return { icon: '🎨', bg: 'bg-pink-500/20 text-pink-300 border-pink-500/30 shadow-pink-500/10' };
    if (lower.includes('ai') || lower.includes('machine') || lower.includes('ml')) return { icon: '🤖', bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 shadow-indigo-500/10' };
    if (lower.includes('gaming') || lower.includes('game')) return { icon: '🎮', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30 shadow-amber-500/10' };
    if (lower.includes('tech') || lower.includes('code') || lower.includes('dev')) return { icon: '💻', bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 shadow-cyan-500/10' };
    return { icon: '💬', bg: 'bg-blue-500/20 text-blue-300 border-blue-500/30 shadow-blue-500/10' };
  };

  return (
    <div className="flex-1 flex flex-col h-full glass-main overflow-hidden relative">
      {/* Channel Header Navigation Bar */}
      <header className="px-6 py-3.5 border-b border-slate-800/80 bg-slate-950/70 flex justify-between items-center shrink-0 backdrop-blur-md relative z-20">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center font-extrabold text-base shadow-sm ${getChannelIconBadge(groupName).bg}`}>
            {getChannelIconBadge(groupName).icon}
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
            onClick={() => setShowOnlineUsers(!showOnlineUsers)}
            className="flex items-center gap-1.5 text-[11px] px-3 py-1 rounded-full font-bold border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-all cursor-pointer"
            title="View Online Members"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{onlineUsers.length} Online</span>
          </button>

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

          <span
            className={`flex items-center gap-1.5 text-[11px] px-3 py-1 rounded-full font-bold border transition-all ${
              isConnected
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            ></span>
            {isConnected ? '⚡ Live' : 'Connecting...'}
          </span>

          <button
            onClick={() => refetch()}
            title="Reload Messages"
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

      {/* Online Users Drawer */}
      {showOnlineUsers && (
        <div className="absolute top-14 right-6 z-30 w-64 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-3">
            <h3 className="text-xs font-extrabold text-white flex items-center gap-1.5">
              <span>🟢 Active Members</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                {onlineUsers.length}
              </span>
            </h3>
            <button
              onClick={() => setShowOnlineUsers(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {onlineUsers.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No online users list available</p>
            ) : (
              onlineUsers.map((u) => (
                <div key={u.userId} className="flex items-center gap-2 text-xs text-slate-200">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] ${getAvatarGradient(u.username)}`}>
                    {getInitials(u.username)}
                  </div>
                  <span className="truncate">{u.username}</span>
                  {u.userId === currentUserId && (
                    <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded ml-auto">
                      You
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Search Bar */}
      {showSearch && (
        <div className="px-6 py-2 bg-slate-950/90 border-b border-slate-800/80 flex items-center gap-2">
          <span className="text-slate-500 text-xs">🔍</span>
          <input
            type="text"
            value={msgFilter}
            onChange={(e) => setMsgFilter(e.target.value)}
            placeholder="Search messages in this channel..."
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

      {/* Messages Feed with Smart Scroll */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 p-6 overflow-y-auto space-y-4"
      >
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
            const isAiBot =
              msg.sender?.username === 'Nexus AI Bot' ||
              msg.content.includes('Daily AI Chat Summary');
            const displaySender = isMine
              ? currentUsername
              : msg.sender?.username || 'Member';

            const reactionsMap = (msg.reactions || []).reduce(
              (acc, r) => {
                if (!acc[r.emoji]) {
                  acc[r.emoji] = { count: 0, users: [], hasReacted: false };
                }
                acc[r.emoji].count += 1;
                acc[r.emoji].users.push(r.user?.username || 'User');
                if (r.userId === currentUserId) acc[r.emoji].hasReacted = true;
                return acc;
              },
              {} as Record<string, { count: number; users: string[]; hasReacted: boolean }>,
            );

            const readCount = (msg.readReceipts || []).length;

            return (
              <div
                key={msg.id}
                className={`group flex gap-3 ${isMine ? 'flex-row-reverse' : 'flex-row'} relative`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-black shrink-0 border relative shadow-lg ${
                    isAiBot
                      ? 'bg-gradient-to-br from-indigo-600 via-purple-700 to-slate-900 border-indigo-400/50 text-indigo-200 shadow-indigo-500/30 ring-2 ring-indigo-500/20 animate-pulse'
                      : getAvatarGradient(displaySender)
                  }`}
                >
                  {isAiBot ? '🤖' : getInitials(displaySender)}
                </div>

                <div
                  className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${
                    isMine ? 'items-end' : 'items-start'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                      {displaySender}
                      {isAiBot && (
                        <span className="text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                          AI Summary
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {msg.isEdited && <span className="ml-1 text-slate-400 italic">(edited)</span>}
                    </span>
                  </div>

                  <div className="relative group/bubble">
                    {!msg.isDeleted && (
                      <div
                        className={`absolute -top-3 ${
                          isMine ? 'left-0' : 'right-0'
                        } hidden group-hover/bubble:flex items-center gap-1 bg-slate-900/95 border border-slate-800 rounded-full px-2 py-1 shadow-2xl backdrop-blur-md z-10 transition-all`}
                      >
                        {['👍', '❤️', '🔥', '😂'].map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleToggleReaction(msg.id, emoji)}
                            className="hover:scale-125 transition-transform text-xs px-1"
                          >
                            {emoji}
                          </button>
                        ))}
                        {isMine && (
                          <>
                            <span className="w-[1px] h-3 bg-slate-800 mx-0.5" />
                            <button
                              onClick={() => handleStartEdit(msg)}
                              className="text-xs text-slate-400 hover:text-blue-400 px-1"
                              title="Edit Message"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="text-xs text-slate-400 hover:text-rose-400 px-1"
                              title="Delete Message"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {editingMessageId === msg.id ? (
                      <div className="flex flex-col gap-2 p-2 bg-slate-900 border border-blue-500/50 rounded-xl">
                        <input
                          type="text"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="bg-slate-950 px-3 py-1.5 rounded-lg text-xs text-white border border-slate-800 focus:outline-none"
                        />
                        <div className="flex justify-end gap-2 text-xs">
                          <button
                            onClick={() => setEditingMessageId(null)}
                            className="px-2 py-1 text-slate-400 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(msg.id)}
                            className="px-3 py-1 bg-blue-600 text-white font-bold rounded-lg"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`px-4 py-3 rounded-2xl text-xs leading-relaxed shadow-md break-words whitespace-pre-wrap ${
                          msg.isDeleted
                            ? 'bg-slate-900/40 border border-slate-800/50 text-slate-500 italic'
                            : isAiBot
                            ? 'bg-slate-900/90 border border-indigo-500/30 text-slate-100 rounded-tl-none shadow-indigo-950/40 backdrop-blur-md'
                            : isMine
                            ? 'gradient-btn text-white rounded-tr-none'
                            : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none'
                        }`}
                      >
                        {msg.fileUrl && !msg.isDeleted && (
                          <div className="mb-2">
                            {msg.fileType === 'image' ? (
                              <a
                                href={`${apiUrl}${msg.fileUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                className="block rounded-xl overflow-hidden border border-slate-700/50 max-w-xs hover:opacity-90 transition-opacity"
                              >
                                <img
                                  src={`${apiUrl}${msg.fileUrl}`}
                                  alt={msg.fileName || 'Attachment'}
                                  className="w-full h-auto object-cover max-h-60"
                                />
                              </a>
                            ) : (
                              <a
                                href={`${apiUrl}${msg.fileUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 p-2 bg-slate-950/60 border border-slate-800 rounded-xl text-blue-400 hover:underline"
                              >
                                <span>📄</span>
                                <span className="truncate max-w-xs">{msg.fileName || 'Download Attachment'}</span>
                              </a>
                            )}
                          </div>
                        )}

                        {msg.content}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {Object.entries(reactionsMap).map(([emoji, data]) => (
                      <button
                        key={emoji}
                        onClick={() => handleToggleReaction(msg.id, emoji)}
                        className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                          data.hasReacted
                            ? 'bg-blue-500/20 border-blue-500/40 text-blue-300 font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                        }`}
                        title={data.users.join(', ')}
                      >
                        <span>{emoji}</span>
                        <span>{data.count}</span>
                      </button>
                    ))}

                    {isMine && !msg.isDeleted && (
                      <span className="text-[10px] text-slate-500 ml-1 flex items-center gap-1">
                        {readCount > 0 ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-0.5" title={`Read by ${readCount} members`}>
                            ✓✓ <span className="text-[9px]">{readCount}</span>
                          </span>
                        ) : (
                          <span title="Sent">✓</span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator Bar */}
      {typingUsers.length > 0 && (
        <div className="px-6 py-1 bg-slate-950/80 text-[11px] text-slate-400 flex items-center gap-2 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping"></span>
          <span>
            {typingUsers.map((u) => u.username).join(', ')}{' '}
            {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </span>
        </div>
      )}

      {/* Message Input Footer */}
      <footer className="p-4 border-t border-slate-800/80 bg-slate-950/90 shrink-0 space-y-2 z-20">
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

        <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            className="p-3 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 rounded-xl transition-all text-sm shrink-0"
            title="Attach Image or File"
          >
            📎
          </button>

          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
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
