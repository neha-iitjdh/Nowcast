import { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export interface PaginationParams {
  page: number;
  limit: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
    nextCursor?: string;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PostCreateInput {
  text: string;
  hashtags?: string[];
  imageUrl?: string;
  parentId?: string;
}

export interface PostUpdateInput {
  text?: string;
  hashtags?: string[];
  imageUrl?: string;
}

export interface UserUpdateInput {
  bio?: string;
  avatar?: string;
}

export interface SearchParams {
  query: string;
  filter?: 'recent' | 'popular' | 'relevant';
  minLikes?: number;
  fromDate?: Date;
  toDate?: Date;
  hashtag?: string;
  username?: string;
}

export interface NotificationPayload {
  type: 'LIKE' | 'REPLY' | 'REPOST' | 'FOLLOW' | 'MENTION';
  userId: string;
  actorId: string;
  actorName: string;
  postId?: string;
  message: string;
}

export interface FeedItem {
  id: string;
  text: string;
  hashtags: string[];
  imageUrl: string | null;
  likesCount: number;
  repliesCount: number;
  repostsCount: number;
  createdAt: Date;
  author: {
    id: string;
    username: string;
    avatar: string | null;
  };
  isLiked?: boolean;
  isReposted?: boolean;
}
