import prisma from '../config/database.js';
import { CreatePostInput, UpdatePostInput, PaginationInput } from '../utils/validation.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';
import { extractHashtags } from '../utils/helpers.js';
import { encodeCursor, parseCursor } from '../utils/helpers.js';

export async function createPost(authorId: string, input: CreatePostInput) {
  const { text, parentId, imageUrl } = input;
  const hashtags = extractHashtags(text);

  // If this is a reply, verify parent exists
  if (parentId) {
    const parentPost = await prisma.post.findUnique({
      where: { id: parentId },
    });
    if (!parentPost) {
      throw new NotFoundError('Parent post not found');
    }
  }

  const post = await prisma.post.create({
    data: {
      text,
      hashtags,
      imageUrl,
      authorId,
      parentId,
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
    },
  });

  // Update parent's reply count if this is a reply
  if (parentId) {
    await prisma.post.update({
      where: { id: parentId },
      data: { repliesCount: { increment: 1 } },
    });
  }

  return post;
}

export async function getPostById(postId: string, currentUserId?: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
      likes: currentUserId
        ? {
            where: { userId: currentUserId },
            select: { id: true },
          }
        : false,
      reposts: currentUserId
        ? {
            where: { userId: currentUserId },
            select: { id: true },
          }
        : false,
      parent: {
        select: {
          id: true,
          text: true,
          author: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      },
    },
  });

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  return {
    ...post,
    isLiked: currentUserId ? post.likes.length > 0 : false,
    isReposted: currentUserId ? post.reposts.length > 0 : false,
    likes: undefined,
    reposts: undefined,
  };
}

export async function updatePost(
  postId: string,
  authorId: string,
  input: UpdatePostInput
) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  if (post.authorId !== authorId) {
    throw new ForbiddenError('You can only edit your own posts');
  }

  const updateData: { text?: string; hashtags?: string[]; imageUrl?: string | null } = {};

  if (input.text !== undefined) {
    updateData.text = input.text;
    updateData.hashtags = extractHashtags(input.text);
  }

  if (input.imageUrl !== undefined) {
    updateData.imageUrl = input.imageUrl;
  }

  const updatedPost = await prisma.post.update({
    where: { id: postId },
    data: updateData,
    include: {
      author: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
    },
  });

  return updatedPost;
}

export async function deletePost(postId: string, authorId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  if (post.authorId !== authorId) {
    throw new ForbiddenError('You can only delete your own posts');
  }

  // Decrement parent's reply count if this is a reply
  if (post.parentId) {
    await prisma.post.update({
      where: { id: post.parentId },
      data: { repliesCount: { decrement: 1 } },
    });
  }

  await prisma.post.delete({
    where: { id: postId },
  });
}

export async function getPostReplies(
  postId: string,
  pagination: PaginationInput,
  currentUserId?: string
) {
  const { limit, cursor } = pagination;
  const cursorData = parseCursor(cursor);

  const replies = await prisma.post.findMany({
    where: {
      parentId: postId,
      ...(cursorData && {
        OR: [
          { createdAt: { lt: cursorData.createdAt } },
          {
            createdAt: cursorData.createdAt,
            id: { lt: cursorData.id },
          },
        ],
      }),
    },
    take: limit + 1,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    include: {
      author: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
      likes: currentUserId
        ? {
            where: { userId: currentUserId },
            select: { id: true },
          }
        : false,
    },
  });

  const hasMore = replies.length > limit;
  const items = hasMore ? replies.slice(0, -1) : replies;
  const lastItem = items[items.length - 1];

  return {
    data: items.map((reply) => ({
      ...reply,
      isLiked: currentUserId ? reply.likes.length > 0 : false,
      likes: undefined,
    })),
    pagination: {
      hasMore,
      nextCursor: lastItem ? encodeCursor(lastItem.createdAt, lastItem.id) : undefined,
    },
  };
}

export async function getUserPosts(
  userId: string,
  pagination: PaginationInput,
  currentUserId?: string
) {
  const { limit, cursor } = pagination;
  const cursorData = parseCursor(cursor);

  const posts = await prisma.post.findMany({
    where: {
      authorId: userId,
      parentId: null, // Only get top-level posts
      ...(cursorData && {
        OR: [
          { createdAt: { lt: cursorData.createdAt } },
          {
            createdAt: cursorData.createdAt,
            id: { lt: cursorData.id },
          },
        ],
      }),
    },
    take: limit + 1,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    include: {
      author: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
      likes: currentUserId
        ? {
            where: { userId: currentUserId },
            select: { id: true },
          }
        : false,
      reposts: currentUserId
        ? {
            where: { userId: currentUserId },
            select: { id: true },
          }
        : false,
    },
  });

  const hasMore = posts.length > limit;
  const items = hasMore ? posts.slice(0, -1) : posts;
  const lastItem = items[items.length - 1];

  return {
    data: items.map((post) => ({
      ...post,
      isLiked: currentUserId ? post.likes.length > 0 : false,
      isReposted: currentUserId ? post.reposts.length > 0 : false,
      likes: undefined,
      reposts: undefined,
    })),
    pagination: {
      hasMore,
      nextCursor: lastItem ? encodeCursor(lastItem.createdAt, lastItem.id) : undefined,
    },
  };
}
