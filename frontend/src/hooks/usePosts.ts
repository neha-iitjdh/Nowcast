import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as postService from '../services/postService';
import * as feedService from '../services/feedService';
import * as interactionService from '../services/interactionService';
import type { Post, CreatePostInput } from '../types';

export function useHomeFeed() {
  return useInfiniteQuery({
    queryKey: ['feed', 'home'],
    queryFn: ({ pageParam }) => feedService.getHomeFeed(pageParam),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.nextCursor : undefined,
    initialPageParam: undefined as string | undefined,
  });
}

export function useExploreFeed() {
  return useInfiniteQuery({
    queryKey: ['feed', 'explore'],
    queryFn: ({ pageParam }) => feedService.getExploreFeed(pageParam),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.nextCursor : undefined,
    initialPageParam: undefined as string | undefined,
  });
}

export function useUserPosts(userId: string) {
  return useInfiniteQuery({
    queryKey: ['posts', 'user', userId],
    queryFn: ({ pageParam }) => postService.getUserPosts(userId, pageParam),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.nextCursor : undefined,
    initialPageParam: undefined as string | undefined,
    enabled: !!userId,
  });
}

export function usePostReplies(postId: string) {
  return useInfiniteQuery({
    queryKey: ['posts', postId, 'replies'],
    queryFn: ({ pageParam }) => postService.getPostReplies(postId, pageParam),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.nextCursor : undefined,
    initialPageParam: undefined as string | undefined,
    enabled: !!postId,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePostInput) => postService.createPost(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => postService.deletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useLikePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, isLiked }: { postId: string; isLiked: boolean }) =>
      isLiked ? interactionService.unlikePost(postId) : interactionService.likePost(postId),
    onMutate: async ({ postId, isLiked }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['feed'] });

      const updatePost = (post: Post) => {
        if (post.id === postId) {
          return {
            ...post,
            isLiked: !isLiked,
            likesCount: isLiked ? post.likesCount - 1 : post.likesCount + 1,
          };
        }
        return post;
      };

      queryClient.setQueriesData({ queryKey: ['feed'] }, (old: unknown) => {
        if (!old) return old;
        const data = old as { pages: { data: Post[] }[] };
        return {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            data: page.data.map(updatePost),
          })),
        };
      });
    },
  });
}

export function useRepost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, isReposted }: { postId: string; isReposted: boolean }) =>
      isReposted ? interactionService.unrepost(postId) : interactionService.repost(postId),
    onMutate: async ({ postId, isReposted }) => {
      await queryClient.cancelQueries({ queryKey: ['feed'] });

      const updatePost = (post: Post) => {
        if (post.id === postId) {
          return {
            ...post,
            isReposted: !isReposted,
            repostsCount: isReposted ? post.repostsCount - 1 : post.repostsCount + 1,
          };
        }
        return post;
      };

      queryClient.setQueriesData({ queryKey: ['feed'] }, (old: unknown) => {
        if (!old) return old;
        const data = old as { pages: { data: Post[] }[] };
        return {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            data: page.data.map(updatePost),
          })),
        };
      });
    },
  });
}
