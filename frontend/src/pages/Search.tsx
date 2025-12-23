import { useState, FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import Layout from '../components/layout/Layout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
    }
  };

  return (
    <Layout>
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10">
        <h1 className="text-xl font-bold p-4 text-gray-900 dark:text-white">Search</h1>
      </div>

      <div className="p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search posts, hashtags, users..."
              className="pl-10"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        {searchParams.get('q') && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Results for "{searchParams.get('q')}"
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Search functionality will be available in Phase 3 with Elasticsearch integration.
            </p>
          </div>
        )}

        {!searchParams.get('q') && (
          <div className="mt-8 text-center text-gray-500 dark:text-gray-400">
            <p>Try searching for posts, hashtags, or users</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
