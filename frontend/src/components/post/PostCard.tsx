import { Link } from 'react-router-dom';
import { FiHeart, FiMessageCircle, FiRepeat, FiTrash2 } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';
import type { Post } from '../../types';
import Avatar from '../ui/Avatar';
import { useAuth } from '../../contexts/AuthContext';
import { useLikePost, useRepost, useDeletePost } from '../../hooks/usePosts';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const { user } = useAuth();
  const likeMutation = useLikePost();
  const repostMutation = useRepost();
  const deleteMutation = useDeletePost();

  const isOwner = user?.id === post.author.id;

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    likeMutation.mutate({ postId: post.id, isLiked: post.isLiked || false });
  };

  const handleRepost = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    repostMutation.mutate({ postId: post.id, isReposted: post.isReposted || false });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this post?')) {
      deleteMutation.mutate(post.id);
    }
  };

  const renderTextWithHashtags = (text: string) => {
    const parts = text.split(/(#\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('#')) {
        return (
          <Link
            key={index}
            to={`/search?q=${encodeURIComponent(part)}`}
            className="text-primary-600 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </Link>
        );
      }
      return part;
    });
  };

  return (
    <Link to={`/post/${post.id}`}>
      <article className="p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
        {/* Reply indicator */}
        {post.parent && (
          <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">
            Replying to{' '}
            <Link
              to={`/profile/${post.parent.author.username}`}
              className="text-primary-600 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              @{post.parent.author.username}
            </Link>
          </div>
        )}

        <div className="flex space-x-3">
          <Link
            to={`/profile/${post.author.username}`}
            onClick={(e) => e.stopPropagation()}
          >
            <Avatar src={post.author.avatar} alt={post.author.username} size="md" />
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <Link
                to={`/profile/${post.author.username}`}
                className="font-semibold text-gray-900 dark:text-white hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                @{post.author.username}
              </Link>
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                · {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </span>
            </div>

            <p className="mt-1 text-gray-900 dark:text-white whitespace-pre-wrap break-words">
              {renderTextWithHashtags(post.text)}
            </p>

            {post.imageUrl && (
              <img
                src={post.imageUrl}
                alt="Post image"
                className="mt-3 rounded-xl max-h-96 object-cover w-full"
              />
            )}

            {/* Actions */}
            <div className="flex items-center justify-between mt-3 max-w-md">
              <button
                onClick={(e) => e.stopPropagation()}
                className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 transition-colors group"
              >
                <span className="p-2 rounded-full group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20">
                  <FiMessageCircle className="w-5 h-5" />
                </span>
                <span className="text-sm">{post.repliesCount}</span>
              </button>

              <button
                onClick={handleRepost}
                className={clsx(
                  'flex items-center space-x-2 transition-colors group',
                  post.isReposted
                    ? 'text-green-500'
                    : 'text-gray-500 dark:text-gray-400 hover:text-green-500'
                )}
              >
                <span className="p-2 rounded-full group-hover:bg-green-50 dark:group-hover:bg-green-900/20">
                  <FiRepeat className="w-5 h-5" />
                </span>
                <span className="text-sm">{post.repostsCount}</span>
              </button>

              <button
                onClick={handleLike}
                className={clsx(
                  'flex items-center space-x-2 transition-colors group',
                  post.isLiked
                    ? 'text-red-500'
                    : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
                )}
              >
                <span className="p-2 rounded-full group-hover:bg-red-50 dark:group-hover:bg-red-900/20">
                  <FiHeart className={clsx('w-5 h-5', post.isLiked && 'fill-current')} />
                </span>
                <span className="text-sm">{post.likesCount}</span>
              </button>

              {isOwner && (
                <button
                  onClick={handleDelete}
                  className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors group"
                >
                  <span className="p-2 rounded-full group-hover:bg-red-50 dark:group-hover:bg-red-900/20">
                    <FiTrash2 className="w-5 h-5" />
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
