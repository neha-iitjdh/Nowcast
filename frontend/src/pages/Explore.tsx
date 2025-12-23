import { useMemo } from 'react';
import Layout from '../components/layout/Layout';
import Feed from '../components/feed/Feed';
import { useExploreFeed } from '../hooks/usePosts';
import type { Post } from '../types';

export default function Explore() {
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useExploreFeed();

  const posts = useMemo(() => {
    if (!data) return [];
    return data.pages.flatMap((page) => page.data) as Post[];
  }, [data]);

  return (
    <Layout>
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10">
        <h1 className="text-xl font-bold p-4 text-gray-900 dark:text-white">Explore</h1>
      </div>

      <Feed
        posts={posts}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage ?? false}
        fetchNextPage={fetchNextPage}
        emptyMessage="No posts yet. Be the first to post!"
      />
    </Layout>
  );
}
