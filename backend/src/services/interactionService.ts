import prisma from '../config/database.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';

// Like/Unlike
export async function likePost(userId: string, postId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  // Check if already liked
  const existingLike = await prisma.like.findUnique({
    where: {
      userId_postId: { userId, postId },
    },
  });

  if (existingLike) {
    throw new ConflictError('Post already liked');
  }

  // Create like and update count in transaction
  const [like] = await prisma.$transaction([
    prisma.like.create({
      data: { userId, postId },
    }),
    prisma.post.update({
      where: { id: postId },
      data: { likesCount: { increment: 1 } },
    }),
  ]);

  return like;
}

export async function unlikePost(userId: string, postId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  const existingLike = await prisma.like.findUnique({
    where: {
      userId_postId: { userId, postId },
    },
  });

  if (!existingLike) {
    throw new NotFoundError('Like not found');
  }

  await prisma.$transaction([
    prisma.like.delete({
      where: { id: existingLike.id },
    }),
    prisma.post.update({
      where: { id: postId },
      data: { likesCount: { decrement: 1 } },
    }),
  ]);
}

// Repost
export async function repost(userId: string, postId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  const existingRepost = await prisma.repost.findUnique({
    where: {
      userId_postId: { userId, postId },
    },
  });

  if (existingRepost) {
    throw new ConflictError('Already reposted');
  }

  const [repostRecord] = await prisma.$transaction([
    prisma.repost.create({
      data: { userId, postId },
    }),
    prisma.post.update({
      where: { id: postId },
      data: { repostsCount: { increment: 1 } },
    }),
  ]);

  return repostRecord;
}

export async function unrepost(userId: string, postId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  const existingRepost = await prisma.repost.findUnique({
    where: {
      userId_postId: { userId, postId },
    },
  });

  if (!existingRepost) {
    throw new NotFoundError('Repost not found');
  }

  await prisma.$transaction([
    prisma.repost.delete({
      where: { id: existingRepost.id },
    }),
    prisma.post.update({
      where: { id: postId },
      data: { repostsCount: { decrement: 1 } },
    }),
  ]);
}

// Follow/Unfollow
export async function followUser(followerId: string, followingId: string) {
  if (followerId === followingId) {
    throw new ConflictError('You cannot follow yourself');
  }

  const userToFollow = await prisma.user.findUnique({
    where: { id: followingId },
  });

  if (!userToFollow) {
    throw new NotFoundError('User not found');
  }

  const existingFollow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: { followerId, followingId },
    },
  });

  if (existingFollow) {
    throw new ConflictError('Already following this user');
  }

  const follow = await prisma.follow.create({
    data: { followerId, followingId },
  });

  return follow;
}

export async function unfollowUser(followerId: string, followingId: string) {
  const existingFollow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: { followerId, followingId },
    },
  });

  if (!existingFollow) {
    throw new NotFoundError('Not following this user');
  }

  await prisma.follow.delete({
    where: { id: existingFollow.id },
  });
}

export async function getFollowers(userId: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;

  const [followers, total] = await Promise.all([
    prisma.follow.findMany({
      where: { followingId: userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            bio: true,
            avatar: true,
          },
        },
      },
    }),
    prisma.follow.count({ where: { followingId: userId } }),
  ]);

  return {
    data: followers.map((f) => f.follower),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  };
}

export async function getFollowing(userId: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;

  const [following, total] = await Promise.all([
    prisma.follow.findMany({
      where: { followerId: userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            bio: true,
            avatar: true,
          },
        },
      },
    }),
    prisma.follow.count({ where: { followerId: userId } }),
  ]);

  return {
    data: following.map((f) => f.following),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  };
}

export async function getPostLikes(postId: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;

  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  const [likes, total] = await Promise.all([
    prisma.like.findMany({
      where: { postId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            bio: true,
            avatar: true,
          },
        },
      },
    }),
    prisma.like.count({ where: { postId } }),
  ]);

  return {
    data: likes.map((l) => l.user),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  };
}
