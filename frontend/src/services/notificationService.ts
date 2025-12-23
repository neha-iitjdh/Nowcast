import api from './api';
import type { Notification, ApiResponse } from '../types';

interface PaginatedNotificationsResponse {
  success: boolean;
  data: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  unreadCount: number;
}

export async function getNotifications(page: number = 1): Promise<PaginatedNotificationsResponse> {
  const response = await api.get<PaginatedNotificationsResponse>(`/notifications?page=${page}&limit=20`);
  return response.data;
}

export async function markAsRead(notificationIds?: string[]): Promise<void> {
  await api.post('/notifications/read', { notificationIds });
}

export async function markAllAsRead(): Promise<void> {
  await api.post('/notifications/read', {});
}
