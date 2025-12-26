# Nowcast - Project Context for LLM

## Overview
Nowcast is a real-time social media platform (Twitter/X clone) with analytics capabilities. Built as a full-stack TypeScript application with Redis for caching/real-time features and Elasticsearch for search/analytics.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Node.js, Express, TypeScript |
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS |
| **Database** | PostgreSQL with Prisma ORM |
| **Cache/Real-time** | Redis (ioredis) |
| **Search** | Elasticsearch (planned Phase 3) |
| **WebSocket** | Socket.io |
| **Auth** | JWT (jsonwebtoken, bcryptjs) |
| **Validation** | Zod |
| **State Management** | React Query, Zustand |

## Project Structure

```
Nowcast/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Database models
│   │   └── seed.ts            # Faker.js seed script (100+ users, 1000+ posts)
│   ├── src/
│   │   ├── config/
│   │   │   ├── index.ts       # Environment config
│   │   │   ├── database.ts    # Prisma client
│   │   │   ├── redis.ts       # Redis connections (main, publisher, subscriber)
│   │   │   └── elasticsearch.ts
│   │   ├── controllers/       # Request handlers
│   │   │   ├── authController.ts
│   │   │   ├── postController.ts
│   │   │   ├── feedController.ts
│   │   │   ├── interactionController.ts
│   │   │   └── notificationController.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts        # JWT authentication
│   │   │   ├── validate.ts    # Zod validation
│   │   │   ├── rateLimit.ts   # Express + Redis rate limiters
│   │   │   └── errorHandler.ts
│   │   ├── routes/
│   │   │   ├── index.ts       # Route aggregator
│   │   │   ├── authRoutes.ts
│   │   │   ├── postRoutes.ts
│   │   │   ├── feedRoutes.ts
│   │   │   ├── interactionRoutes.ts
│   │   │   └── notificationRoutes.ts
│   │   ├── services/
│   │   │   ├── authService.ts
│   │   │   ├── postService.ts
│   │   │   ├── feedService.ts        # With Redis caching
│   │   │   ├── interactionService.ts # Like/repost/follow with notifications
│   │   │   ├── cacheService.ts       # Redis cache utilities
│   │   │   └── notificationService.ts # Redis pub/sub notifications
│   │   ├── websocket/
│   │   │   └── socketHandler.ts      # Socket.io setup
│   │   ├── types/index.ts
│   │   ├── utils/
│   │   │   ├── errors.ts      # Custom error classes
│   │   │   ├── helpers.ts     # Hashtag extraction, cursor pagination
│   │   │   └── validation.ts  # Zod schemas
│   │   ├── app.ts             # Express app setup
│   │   └── index.ts           # Server entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/            # Button, Input, Avatar, Spinner
│   │   │   ├── layout/        # Layout, AuthLayout, NotificationBell
│   │   │   ├── post/          # PostCard, CreatePost
│   │   │   └── feed/          # Feed (infinite scroll)
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx
│   │   │   └── SocketContext.tsx
│   │   ├── hooks/
│   │   │   ├── usePosts.ts    # React Query hooks for posts/feed
│   │   │   ├── useUser.ts     # Profile, follow hooks
│   │   │   └── useNotifications.ts
│   │   ├── pages/
│   │   │   ├── Login.tsx, Register.tsx
│   │   │   ├── Home.tsx, Explore.tsx
│   │   │   ├── Profile.tsx, PostDetail.tsx
│   │   │   └── Search.tsx
│   │   ├── services/          # Axios API clients
│   │   ├── types/index.ts
│   │   ├── App.tsx            # Routes with protected/public handling
│   │   ├── main.tsx
│   │   └── index.css          # Tailwind + custom components
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
├── docker-compose.yml         # PostgreSQL, Redis, Elasticsearch
├── package.json               # Monorepo workspaces
└── README.md
```

## Database Schema (Prisma)

```prisma
model User {
  id, email, username, password, bio, avatar
  posts[], likes[], replies[], reposts[]
  followers[] (Follow), following[] (Follow)
  notifications[]
}

model Post {
  id, text (280 chars), hashtags[], imageUrl
  likesCount, repliesCount, repostsCount
  authorId -> User
  parentId -> Post (for threads/replies)
  likes[], replyRecords[], reposts[]
}

model Like { userId, postId } // unique constraint
model Reply { userId, postId, text }
model Repost { userId, postId } // unique constraint
model Follow { followerId, followingId } // unique constraint
model Notification { type, userId, actorId, actorName, postId, read }

enum NotificationType { LIKE, REPLY, REPOST, FOLLOW, MENTION }
```

## API Endpoints

### Auth (`/api/auth`)
- `POST /register` - Register user
- `POST /login` - Login, returns JWT
- `GET /me` - Get current user (protected)
- `PATCH /me` - Update profile (protected)
- `GET /users/:username` - Get user by username

### Posts (`/api/posts`)
- `POST /` - Create post (protected, rate limited)
- `GET /:id` - Get post
- `PATCH /:id` - Update post (owner only)
- `DELETE /:id` - Delete post (owner only)
- `GET /:id/replies` - Get replies (cursor pagination)
- `GET /user/:userId` - Get user's posts

### Feed (`/api/feed`)
- `GET /home` - Home feed (protected, cached)
- `GET /explore` - Explore feed (public)
- `GET /trending` - Trending posts (cached)

### Interactions (`/api/`)
- `POST/DELETE /posts/:postId/like` - Like/unlike
- `POST/DELETE /posts/:postId/repost` - Repost/unrepost
- `POST/DELETE /users/:userId/follow` - Follow/unfollow
- `GET /users/:userId/followers` - Get followers
- `GET /users/:userId/following` - Get following
- `GET /posts/:postId/likes` - Get users who liked

### Notifications (`/api/notifications`)
- `GET /` - Get notifications (protected)
- `POST /read` - Mark as read

## Implementation Status

### Phase 1 (Complete) - MVP
- [x] User authentication (JWT)
- [x] Post CRUD (280 char limit, hashtags, images)
- [x] Thread/reply support
- [x] Like/Unlike, Repost
- [x] Follow/Unfollow
- [x] Home feed (posts from followed users)
- [x] Explore feed (all posts)
- [x] Cursor-based pagination with infinite scroll
- [x] WebSocket infrastructure (Socket.io)

### Phase 2 (Complete) - Redis Integration
- [x] Feed caching (10 min TTL)
- [x] Trending posts cache (5 min TTL)
- [x] Redis pub/sub for real-time notifications
- [x] Notification system (like, reply, repost, follow, mention)
- [x] Redis-based rate limiting (sliding window)
- [x] Cache invalidation on interactions
- [x] NotificationBell UI component

### Phase 3 (Planned) - Elasticsearch
- [ ] Index posts on create/update
- [ ] Full-text search with relevance scoring
- [ ] Hashtag search and suggestions
- [ ] Advanced filters (date, user, min_likes)
- [ ] User search with autocomplete

### Phase 4 (Planned) - Analytics
- [ ] Trending topics aggregation
- [ ] User engagement metrics
- [ ] Analytics dashboard
- [ ] Export functionality

## Key Implementation Details

### Authentication
- JWT stored in localStorage, sent via `Authorization: Bearer` header
- `authenticate` middleware for protected routes
- `optionalAuth` middleware for routes with optional user context

### Caching Strategy
- Feed cache: List of post IDs in Redis, fetch posts from DB
- Cache invalidation: On new post, invalidate all followers' feeds
- Trending: Cached for 5 minutes, refreshed on miss

### Real-time Notifications
- Redis pub/sub channels for notification distribution
- Socket.io rooms: `user:{userId}` for personal notifications
- Notifications stored in DB and pushed via WebSocket

### Rate Limiting
- Express-rate-limit for basic limits
- Redis sorted sets for sliding window rate limiting
- Per-user limits: 60 posts/hr, 200 likes/hr, 100 follows/hr

### Pagination
- Cursor-based using `createdAt` + `id` (base64 encoded)
- Infinite scroll with React Query's `useInfiniteQuery`

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nowcast"

# Redis
REDIS_URL="redis://localhost:6379"

# Elasticsearch
ELASTICSEARCH_URL="http://localhost:9200"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV=development
```

## Running the Project

```bash
# Start infrastructure
docker-compose up -d postgres redis

# Backend
cd backend
npm install
npm run db:generate
npm run db:migrate
npm run db:seed  # Creates test user: test@example.com / Password123
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

## Test Credentials
- Email: `test@example.com`
- Password: `Password123`
