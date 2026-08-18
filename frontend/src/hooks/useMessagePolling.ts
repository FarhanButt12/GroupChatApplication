import { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL } from '../config/constants';

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

interface UseMessagePollingOptions {
  groupId: string;
  token: string;
  intervalMs?: number; // Default 10000ms (10 seconds)
  apiUrl?: string;
}

export function useMessagePolling({
  groupId,
  token,
  intervalMs = 10000,
  apiUrl = API_BASE_URL,
}: UseMessagePollingOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isMember, setIsMember] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef<boolean>(true);

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
          // User is not a member of this group
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

  useEffect(() => {
    isMountedRef.current = true;
    setIsMember(true); // Reset membership status on channel switch

    // 1. Initial fetch
    fetchMessages(true);

    // 2. Setup 10-second polling interval
    const intervalId = setInterval(() => {
      fetchMessages(false);
    }, intervalMs);

    // 3. Cleanup on unmount or channel switch
    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [fetchMessages, intervalMs]);

  // Join group API action
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
    joinGroup,
    refetch,
  };
}
