export interface User {
  id: string;
  email: string;
  username: string;
  bio: string | null;
  avatar: string | null;
  createdAt?: string;
  postsCount?: number;
  followersCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
}

export interface Post {
  id: string;
  text: string;
  hashtags: string[];
  imageUrl: string | null;
  likesCount: number;
  repliesCount: number;
  repostsCount: number;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    username: string;
    avatar: string | null;
  };
  parent?: {
    id: string;
    text: string;
    author: {
      id: string;
      username: string;
    };
  } | null;
  isLiked?: boolean;
  isReposted?: boolean;
}

export interface Notification {
  id: string;
  type: 'LIKE' | 'REPLY' | 'REPOST' | 'FOLLOW' | 'MENTION';
  read: boolean;
  createdAt: string;
  postId?: string;
  actorId?: string;
  actorName?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    hasMore: boolean;
    nextCursor?: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  username: string;
  password: string;
}

export interface CreatePostInput {
  text: string;
  parentId?: string;
  imageUrl?: string;
}
