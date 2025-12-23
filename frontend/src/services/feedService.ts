import api from './api';
import type { Post, PaginatedResponse, ApiResponse } from '../types';

export async function getHomeFeed(cursor?: string): Promise<PaginatedResponse<Post>> {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  params.set('limit', '20');

  const response = await api.get<PaginatedResponse<Post>>(`/feed/home?${params}`);
  return response.data;
}

export async function getExploreFeed(cursor?: string): Promise<PaginatedResponse<Post>> {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  params.set('limit', '20');

  const response = await api.get<PaginatedResponse<Post>>(`/feed/explore?${params}`);
  return response.data;
}

export async function getTrendingPosts(limit: number = 10): Promise<Post[]> {
  const response = await api.get<ApiResponse<Post[]>>(`/feed/trending?limit=${limit}`);
  return response.data.data!;
}
