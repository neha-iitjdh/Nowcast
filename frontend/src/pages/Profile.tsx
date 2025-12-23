import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiCalendar, FiArrowLeft } from 'react-icons/fi';
import { format } from 'date-fns';
import Layout from '../components/layout/Layout';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Feed from '../components/feed/Feed';
import Spinner from '../components/ui/Spinner';
import { useProfile, useFollowUser } from '../hooks/useUser';
import { useUserPosts } from '../hooks/usePosts';
import { useAuth } from '../contexts/AuthContext';
import type { Post } from '../types';

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(username || '');
  const followMutation = useFollowUser();
  const { data: postsData, isLoading: postsLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useUserPosts(profile?.id || '');

  const posts = useMemo(() => {
    if (!postsData) return [];
    return postsData.pages.flatMap((page) => page.data) as Post[];
  }, [postsData]);

  const isOwnProfile = currentUser?.id === profile?.id;

  const handleFollowToggle = () => {
    if (!profile) return;
    followMutation.mutate({
      userId: profile.id,
      isFollowing: profile.isFollowing || false,
    });
  };

  if (profileLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">User not found</h2>
          <Link to="/" className="mt-4 text-primary-600 hover:underline">
            Go back home
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10">
        <div className="flex items-center space-x-4 p-4">
          <Link to="/" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <FiArrowLeft className="w-5 h-5 text-gray-900 dark:text-white" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">@{profile.username}</h1>
            <p className="text-sm text-gray-500">{profile.postsCount} posts</p>
          </div>
        </div>
      </div>

      {/* Profile info */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <Avatar src={profile.avatar} alt={profile.username} size="xl" />

          {currentUser && !isOwnProfile && (
            <Button
              variant={profile.isFollowing ? 'outline' : 'primary'}
              onClick={handleFollowToggle}
              isLoading={followMutation.isPending}
            >
              {profile.isFollowing ? 'Unfollow' : 'Follow'}
            </Button>
          )}
        </div>

        <div className="mt-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">@{profile.username}</h2>
          {profile.bio && (
            <p className="mt-2 text-gray-700 dark:text-gray-300">{profile.bio}</p>
          )}

          <div className="flex items-center mt-3 text-gray-500 dark:text-gray-400">
            <FiCalendar className="w-4 h-4 mr-1" />
            <span className="text-sm">
              Joined {format(new Date(profile.createdAt || Date.now()), 'MMMM yyyy')}
            </span>
          </div>

          <div className="flex space-x-4 mt-3">
            <Link
              to={`/profile/${username}/following`}
              className="text-sm text-gray-700 dark:text-gray-300 hover:underline"
            >
              <span className="font-bold">{profile.followingCount}</span>{' '}
              <span className="text-gray-500">Following</span>
            </Link>
            <Link
              to={`/profile/${username}/followers`}
              className="text-sm text-gray-700 dark:text-gray-300 hover:underline"
            >
              <span className="font-bold">{profile.followersCount}</span>{' '}
              <span className="text-gray-500">Followers</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex">
          <button className="flex-1 py-4 text-center font-bold text-primary-600 border-b-2 border-primary-600">
            Posts
          </button>
        </div>
      </div>

      <Feed
        posts={posts}
        isLoading={postsLoading}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage ?? false}
        fetchNextPage={fetchNextPage}
        emptyMessage="No posts yet"
      />
    </Layout>
  );
}
