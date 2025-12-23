import api from './api';
import type { Post, CreatePostInput, PaginatedResponse, ApiResponse } from '../types';

export async function createPost(input: CreatePostInput): Promise<Post> {
  const response = await api.post<ApiResponse<Post>>('/posts', input);
  return response.data.data!;
}

export async function getPost(id: string): Promise<Post> {
  const response = await api.get<ApiResponse<Post>>(`/posts/${id}`);
  return response.data.data!;
}

export async function updatePost(id: string, data: { text?: string }): Promise<Post> {
  const response = await api.patch<ApiResponse<Post>>(`/posts/${id}`, data);
  return response.data.data!;
}

export async function deletePost(id: string): Promise<void> {
  await api.delete(`/posts/${id}`);
}

export async function getPostReplies(postId: string, cursor?: string): Promise<PaginatedResponse<Post>> {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  params.set('limit', '20');

  const response = await api.get<PaginatedResponse<Post>>(`/posts/${postId}/replies?${params}`);
  return response.data;
}

export async function getUserPosts(userId: string, cursor?: string): Promise<PaginatedResponse<Post>> {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  params.set('limit', '20');

  const response = await api.get<PaginatedResponse<Post>>(`/posts/user/${userId}?${params}`);
  return response.data;
}
