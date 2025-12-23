import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createPostSchema = z.object({
  text: z
    .string()
    .min(1, 'Post text is required')
    .max(280, 'Post text must be at most 280 characters'),
  parentId: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

export const updatePostSchema = z.object({
  text: z
    .string()
    .min(1, 'Post text is required')
    .max(280, 'Post text must be at most 280 characters')
    .optional(),
  imageUrl: z.string().url().optional().nullable(),
});

export const updateUserSchema = z.object({
  bio: z.string().max(160, 'Bio must be at most 160 characters').optional(),
  avatar: z.string().url().optional().nullable(),
});

export const searchSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  filter: z.enum(['recent', 'popular', 'relevant']).optional().default('relevant'),
  minLikes: z.coerce.number().int().min(0).optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  cursor: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
