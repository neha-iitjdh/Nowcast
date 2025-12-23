import { useMemo } from 'react';
import Layout from '../components/layout/Layout';
import CreatePost from '../components/post/CreatePost';
import Feed from '../components/feed/Feed';
import { useHomeFeed } from '../hooks/usePosts';
import { useAuth } from '../contexts/AuthContext';
import type { Post } from '../types';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useHomeFeed();

  const posts = useMemo(() => {
    if (!data) return [];
    return data.pages.flatMap((page) => page.data) as Post[];
  }, [data]);

  return (
    <Layout>
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10">
        <h1 className="text-xl font-bold p-4 text-gray-900 dark:text-white">Home</h1>
      </div>

      {isAuthenticated && <CreatePost />}

      <Feed
        posts={posts}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage ?? false}
        fetchNextPage={fetchNextPage}
        emptyMessage="Follow some users to see their posts here!"
      />
    </Layout>
  );
}
