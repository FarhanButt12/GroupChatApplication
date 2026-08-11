import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config/constants';

export interface Sender {
  id: string;
  username: string;
  email: string;
}

export interface Reaction {
  id: string;
  emoji: string;
  userId: string;
  user: Sender;
}

export interface ReadReceipt {
  id: string;
  userId: string;
  readAt: string;
  user: Sender;
}

export interface Message {
  id: string;
  content: string;
  groupId: string;
  senderId: string;
  createdAt: string;
  updatedAt?: string;
  sender: Sender;
  fileUrl?: string | null;
  fileType?: string | null;
  fileName?: string | null;
  isEdited?: boolean;
  isDeleted?: boolean;
  reactions?: Reaction[];
  readReceipts?: ReadReceipt[];
}

export interface OnlineUser {
  userId: string;
  username: string;
}

export interface FetchMessagesResponse {
  data: Message[];
  pagination: {
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

interface UseMessageSocketOptions {
  groupId: string;
  token: string;
  apiUrl?: string;
}

export function useMessageSocket({
  groupId,
  token,
  apiUrl = API_BASE_URL,
}: UseMessageSocketOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isMember, setIsMember] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<OnlineUser[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // 1. Initial chat history fetch via REST API
  const fetchMessages = useCallback(
    async (isInitial = false) => {
      if (!groupId || !token) return;

      if (isInitial) {
        setLoading(true);
      }

      try {
        const response = await fetch(
          `${apiUrl}/groups/${groupId}/messages?page=1&limit=50`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.status === 403) {
          if (isMountedRef.current) {
            setIsMember(false);
            setMessages([]);
            setError(null);
          }
          return;
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch messages');
        }

        const result: FetchMessagesResponse = await response.json();

        if (isMountedRef.current) {
          setIsMember(true);
          const chronologicalMessages = Array.isArray(result.data)
            ? [...result.data].reverse()
            : [];
          setMessages(chronologicalMessages);
          setError(null);
        }
      } catch (err: any) {
        if (isMountedRef.current) {
          setError(err.message || 'Error fetching messages');
        }
      } finally {
        if (isMountedRef.current && isInitial) {
          setLoading(false);
        }
      }
    },
    [groupId, token, apiUrl],
  );

  // 2. Real-time Socket.IO connection and listeners
  useEffect(() => {
    isMountedRef.current = true;
    setIsMember(true);

    fetchMessages(true);

    if (!groupId || !token) return;

    const socket = io(apiUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      if (isMountedRef.current) {
        setIsConnected(true);
      }
      socket.emit('joinRoom', { groupId });
    });

    socket.on('disconnect', () => {
      if (isMountedRef.current) {
        setIsConnected(false);
      }
    });

    socket.on('newMessage', (newMsg: Message) => {
      if (isMountedRef.current && newMsg.groupId === groupId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) {
            return prev.map((m) => (m.id === newMsg.id ? newMsg : m));
          }
          return [...prev, newMsg];
        });
      }
    });

    socket.on('messageUpdated', (updatedMsg: Message) => {
      if (isMountedRef.current && updatedMsg.groupId === groupId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m)),
        );
      }
    });

    socket.on('messageDeleted', ({ messageId, groupId: msgGroupId }: { messageId: string; groupId: string }) => {
      if (isMountedRef.current && msgGroupId === groupId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  content: 'This message was deleted',
                  isDeleted: true,
                  fileUrl: null,
                  fileName: null,
                }
              : m,
          ),
        );
      }
    });

    socket.on('onlineUsers', (data: { groupId: string; users: OnlineUser[] }) => {
      if (isMountedRef.current && data.groupId === groupId) {
        setOnlineUsers(data.users || []);
      }
    });

    socket.on('userTyping', (data: { groupId: string; userId: string; username: string; isTyping: boolean }) => {
      if (isMountedRef.current && data.groupId === groupId) {
        setTypingUsers((prev) => {
          if (data.isTyping) {
            if (!prev.some((u) => u.userId === data.userId)) {
              return [...prev, { userId: data.userId, username: data.username }];
            }
            return prev;
          } else {
            return prev.filter((u) => u.userId !== data.userId);
          }
        });
      }
    });

    return () => {
      isMountedRef.current = false;
      if (socket) {
        socket.emit('leaveRoom', { groupId });
        socket.disconnect();
      }
    };
  }, [groupId, token, apiUrl, fetchMessages]);

  const emitTypingStart = useCallback(() => {
    if (socketRef.current?.connected && groupId) {
      socketRef.current.emit('typing:start', { groupId });
    }
  }, [groupId]);

  const emitTypingStop = useCallback(() => {
    if (socketRef.current?.connected && groupId) {
      socketRef.current.emit('typing:stop', { groupId });
    }
  }, [groupId]);

  const joinGroup = useCallback(async () => {
    if (!groupId || !token) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/groups/${groupId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to join group');
      }

      setIsMember(true);
      await fetchMessages(true);

      if (socketRef.current?.connected) {
        socketRef.current.emit('joinRoom', { groupId });
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err.message || 'Could not join group');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [groupId, token, apiUrl, fetchMessages]);

  const refetch = useCallback(() => {
    return fetchMessages(false);
  }, [fetchMessages]);

  return {
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
  };
}
