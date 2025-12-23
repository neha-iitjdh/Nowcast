import api from './api';
import type { User, ApiResponse } from '../types';

interface PaginatedUsersResponse {
  success: boolean;
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// Like/Unlike
export async function likePost(postId: string): Promise<void> {
  await api.post(`/posts/${postId}/like`);
}

export async function unlikePost(postId: string): Promise<void> {
  await api.delete(`/posts/${postId}/like`);
}

// Repost/Unrepost
export async function repost(postId: string): Promise<void> {
  await api.post(`/posts/${postId}/repost`);
}

export async function unrepost(postId: string): Promise<void> {
  await api.delete(`/posts/${postId}/repost`);
}

// Follow/Unfollow
export async function followUser(userId: string): Promise<void> {
  await api.post(`/users/${userId}/follow`);
}

export async function unfollowUser(userId: string): Promise<void> {
  await api.delete(`/users/${userId}/follow`);
}

// Get followers/following
export async function getFollowers(userId: string, page: number = 1): Promise<PaginatedUsersResponse> {
  const response = await api.get<PaginatedUsersResponse>(`/users/${userId}/followers?page=${page}&limit=20`);
  return response.data;
}

export async function getFollowing(userId: string, page: number = 1): Promise<PaginatedUsersResponse> {
  const response = await api.get<PaginatedUsersResponse>(`/users/${userId}/following?page=${page}&limit=20`);
  return response.data;
}

// Get post likes
export async function getPostLikes(postId: string, page: number = 1): Promise<PaginatedUsersResponse> {
  const response = await api.get<PaginatedUsersResponse>(`/posts/${postId}/likes?page=${page}&limit=20`);
  return response.data;
}
