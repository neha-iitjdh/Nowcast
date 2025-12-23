import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useSocket } from '../contexts/SocketContext';
import * as notificationService from '../services/notificationService';
import type { Notification } from '../types';

export function useNotifications(page: number = 1) {
  return useQuery({
    queryKey: ['notifications', page],
    queryFn: () => notificationService.getNotifications(page),
  });
}

export function useUnreadCount() {
  const { data } = useNotifications(1);
  return data?.unreadCount ?? 0;
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationIds?: string[]) => notificationService.markAsRead(notificationIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useRealtimeNotifications() {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNotification = (data: Notification) => {
      setLatestNotification(data);
      // Invalidate notifications query to refetch
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    socket.on('notification', handleNotification);

    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket, isConnected, queryClient]);

  return { latestNotification, clearLatest: () => setLatestNotification(null) };
}
