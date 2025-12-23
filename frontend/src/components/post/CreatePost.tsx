import { useState, FormEvent } from 'react';
import { FiImage, FiX } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useCreatePost } from '../../hooks/usePosts';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import toast from 'react-hot-toast';

interface CreatePostProps {
  parentId?: string;
  placeholder?: string;
  onSuccess?: () => void;
}

export default function CreatePost({ parentId, placeholder = "What's happening?", onSuccess }: CreatePostProps) {
  const { user } = useAuth();
  const createPost = useCreatePost();
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);

  const charCount = text.length;
  const maxChars = 280;
  const isOverLimit = charCount > maxChars;
  const canSubmit = text.trim().length > 0 && !isOverLimit && !createPost.isPending;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      await createPost.mutateAsync({
        text: text.trim(),
        parentId,
        imageUrl: imageUrl || undefined,
      });
      setText('');
      setImageUrl('');
      setShowImageInput(false);
      toast.success(parentId ? 'Reply posted!' : 'Post created!');
      onSuccess?.();
    } catch (error) {
      toast.error('Failed to create post');
    }
  };

  if (!user) return null;

  return (
    <form onSubmit={handleSubmit} className="p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex space-x-3">
        <Avatar src={user.avatar} alt={user.username} size="md" />
        <div className="flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder}
            className="w-full resize-none bg-transparent text-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none"
            rows={3}
          />

          {showImageInput && (
            <div className="mt-2 flex items-center space-x-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Image URL"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
              />
              <button
                type="button"
                onClick={() => {
                  setShowImageInput(false);
                  setImageUrl('');
                }}
                className="p-2 text-gray-500 hover:text-red-500"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowImageInput(!showImageInput)}
                className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-full transition-colors"
              >
                <FiImage className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <span
                className={`text-sm ${
                  isOverLimit
                    ? 'text-red-500'
                    : charCount > maxChars * 0.9
                    ? 'text-yellow-500'
                    : 'text-gray-500'
                }`}
              >
                {charCount}/{maxChars}
              </span>
              <Button
                type="submit"
                disabled={!canSubmit}
                isLoading={createPost.isPending}
              >
                {parentId ? 'Reply' : 'Post'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
