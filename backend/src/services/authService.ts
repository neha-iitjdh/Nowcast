import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
import { generateToken } from '../middleware/auth.js';
import { RegisterInput, LoginInput } from '../utils/validation.js';
import { ConflictError, UnauthorizedError, NotFoundError } from '../utils/errors.js';

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    username: string;
    bio: string | null;
    avatar: string | null;
  };
  token: string;
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const { email, username, password } = input;

  // Check if user exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw new ConflictError('Email already registered');
    }
    throw new ConflictError('Username already taken');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      username,
      password: hashedPassword,
    },
    select: {
      id: true,
      email: true,
      username: true,
      bio: true,
      avatar: true,
    },
  });

  const token = generateToken({ id: user.id, email: user.email, username: user.username });

  return { user, token };
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const { email, password } = input;

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      username: true,
      password: true,
      bio: true,
      avatar: true,
    },
  });

  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const token = generateToken({ id: user.id, email: user.email, username: user.username });

  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      bio: true,
      avatar: true,
      createdAt: true,
      _count: {
        select: {
          posts: true,
          followers: true,
          following: true,
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return {
    ...user,
    postsCount: user._count.posts,
    followersCount: user._count.followers,
    followingCount: user._count.following,
    _count: undefined,
  };
}

export async function getUserByUsername(username: string, currentUserId?: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      bio: true,
      avatar: true,
      createdAt: true,
      _count: {
        select: {
          posts: true,
          followers: true,
          following: true,
        },
      },
      followers: currentUserId
        ? {
            where: { followerId: currentUserId },
            select: { id: true },
          }
        : false,
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return {
    id: user.id,
    username: user.username,
    bio: user.bio,
    avatar: user.avatar,
    createdAt: user.createdAt,
    postsCount: user._count.posts,
    followersCount: user._count.followers,
    followingCount: user._count.following,
    isFollowing: currentUserId ? user.followers.length > 0 : false,
  };
}

export async function updateProfile(
  userId: string,
  data: { bio?: string; avatar?: string | null }
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      username: true,
      bio: true,
      avatar: true,
    },
  });

  return user;
}
