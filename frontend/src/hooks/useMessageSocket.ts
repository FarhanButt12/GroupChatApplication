import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export interface Sender {
  id: string;
  username: string;
  email: string;
}

export interface Message {
  id: string;
  content: string;
  groupId: string;
  senderId: string;
  createdAt: string;
  sender: Sender;
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
  apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
}: UseMessageSocketOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isMember, setIsMember] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

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

  // 2. Real-time Socket.IO connection and group room listener
  useEffect(() => {
    isMountedRef.current = true;
    setIsMember(true);

    // Load initial chat history
    fetchMessages(true);

    if (!groupId || !token) return;

    // Connect to Socket.IO backend
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

    // Listen for live broadcast messages
    socket.on('newMessage', (newMsg: Message) => {
      if (isMountedRef.current && newMsg.groupId === groupId) {
        setMessages((prev) => {
          // Avoid duplicate messages
          if (prev.some((m) => m.id === newMsg.id)) {
            return prev;
          }
          return [...prev, newMsg];
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

  // Join channel API action for non-members
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
    joinGroup,
    refetch,
  };
}
