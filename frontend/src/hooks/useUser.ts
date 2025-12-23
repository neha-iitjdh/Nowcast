import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as authService from '../services/authService';
import * as interactionService from '../services/interactionService';
import { useAuth } from '../contexts/AuthContext';
import type { User } from '../types';

export function useProfile(username: string) {
  return useQuery({
    queryKey: ['user', username],
    queryFn: () => authService.getUserByUsername(username),
    enabled: !!username,
  });
}

export function useFollowUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, isFollowing }: { userId: string; isFollowing: boolean }) =>
      isFollowing
        ? interactionService.unfollowUser(userId)
        : interactionService.followUser(userId),
    onMutate: async ({ userId, isFollowing }) => {
      await queryClient.cancelQueries({ queryKey: ['user'] });

      queryClient.setQueriesData({ queryKey: ['user'] }, (old: unknown) => {
        if (!old) return old;
        const user = old as User;
        if (user.id === userId) {
          return {
            ...user,
            isFollowing: !isFollowing,
            followersCount: isFollowing
              ? (user.followersCount || 1) - 1
              : (user.followersCount || 0) + 1,
          };
        }
        return user;
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { updateUser } = useAuth();

  return useMutation({
    mutationFn: (data: { bio?: string; avatar?: string | null }) =>
      authService.updateProfile(data),
    onSuccess: (data) => {
      updateUser(data);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

export function useFollowers(userId: string, page: number = 1) {
  return useQuery({
    queryKey: ['user', userId, 'followers', page],
    queryFn: () => interactionService.getFollowers(userId, page),
    enabled: !!userId,
  });
}

export function useFollowing(userId: string, page: number = 1) {
  return useQuery({
    queryKey: ['user', userId, 'following', page],
    queryFn: () => interactionService.getFollowing(userId, page),
    enabled: !!userId,
  });
}
