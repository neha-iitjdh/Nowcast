import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FiArrowLeft } from 'react-icons/fi';
import Layout from '../components/layout/Layout';
import PostCard from '../components/post/PostCard';
import CreatePost from '../components/post/CreatePost';
import Feed from '../components/feed/Feed';
import Spinner from '../components/ui/Spinner';
import { useAuth } from '../contexts/AuthContext';
import { usePostReplies } from '../hooks/usePosts';
import * as postService from '../services/postService';
import type { Post } from '../types';

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();

  const { data: post, isLoading: postLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: () => postService.getPost(id!),
    enabled: !!id,
  });

  const { data: repliesData, isLoading: repliesLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = usePostReplies(id || '');

  const replies = useMemo(() => {
    if (!repliesData) return [];
    return repliesData.pages.flatMap((page) => page.data) as Post[];
  }, [repliesData]);

  if (postLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Post not found</h2>
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
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Post</h1>
        </div>
      </div>

      {/* Main post */}
      <PostCard post={post} />

      {/* Reply composer */}
      {isAuthenticated && (
        <CreatePost
          parentId={id}
          placeholder="Post your reply"
        />
      )}

      {/* Replies */}
      <Feed
        posts={replies}
        isLoading={repliesLoading}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage ?? false}
        fetchNextPage={fetchNextPage}
        emptyMessage="No replies yet. Be the first to reply!"
      />
    </Layout>
  );
}
