# Nowcast - Real-Time Social Media Feed with Analytics

A Twitter-like social media platform for posting, interacting, and deriving insights. Built with Redis for real-time features and Elasticsearch for powerful search/analytics.

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **Frontend**: React, TypeScript, Vite, TailwindCSS
- **Database**: PostgreSQL
- **Cache/Real-time**: Redis
- **Search/Analytics**: Elasticsearch
- **Real-time Communication**: Socket.io

## Features

### Phase 1 (Current - MVP)
- User authentication (register/login/logout)
- Profile management (bio, avatar)
- Post creation, editing, deletion (280 char limit, hashtags, images)
- Thread support (replies)
- Like/Unlike posts
- Follow/Unfollow users
- Personalized home feed
- Explore feed (all posts)
- Infinite scroll pagination
- Real-time WebSocket connection setup

### Phase 2 (Upcoming)
- Redis caching for feeds
- Redis pub/sub for real-time notifications
- Rate limiting with Redis

### Phase 3 (Upcoming)
- Elasticsearch integration for search
- Advanced filters (by date, user, likes)
- Hashtag suggestions

### Phase 4 (Upcoming)
- Analytics dashboard
- Trending topics
- Engagement metrics

## Quick Start

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- npm or yarn

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Nowcast
   ```

2. **Start infrastructure services**
   ```bash
   docker-compose up -d postgres redis elasticsearch
   ```

3. **Setup backend**
   ```bash
   cd backend
   cp .env.example .env
   npm install
   npm run db:generate
   npm run db:migrate
   npm run db:seed  # Seeds 1k+ users and posts
   ```

4. **Setup frontend**
   ```bash
   cd ../frontend
   npm install
   ```

5. **Start development servers**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - API Health: http://localhost:3001/health

### Test Credentials
After running the seed script:
- Email: `test@example.com`
- Password: `Password123`

## Docker Deployment

Run the entire stack with Docker:

```bash
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379
- Elasticsearch on port 9200
- Backend API on port 3001
- Frontend on port 5173

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PATCH /api/auth/me` - Update profile
- `GET /api/auth/users/:username` - Get user by username

### Posts
- `POST /api/posts` - Create post
- `GET /api/posts/:id` - Get post
- `PATCH /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `GET /api/posts/:id/replies` - Get post replies
- `GET /api/posts/user/:userId` - Get user's posts

### Feed
- `GET /api/feed/home` - Home feed (authenticated)
- `GET /api/feed/explore` - Explore feed (public)
- `GET /api/feed/trending` - Trending posts

### Interactions
- `POST /api/posts/:postId/like` - Like post
- `DELETE /api/posts/:postId/like` - Unlike post
- `POST /api/posts/:postId/repost` - Repost
- `DELETE /api/posts/:postId/repost` - Remove repost
- `POST /api/users/:userId/follow` - Follow user
- `DELETE /api/users/:userId/follow` - Unfollow user
- `GET /api/users/:userId/followers` - Get followers
- `GET /api/users/:userId/following` - Get following

## Project Structure

```
Nowcast/
├── backend/
│   ├── src/
│   │   ├── config/        # Database, Redis, ES configs
│   │   ├── controllers/   # Request handlers
│   │   ├── middleware/    # Auth, validation, error handling
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── types/         # TypeScript types
│   │   ├── utils/         # Helpers and utilities
│   │   ├── websocket/     # Socket.io handlers
│   │   ├── app.ts         # Express app setup
│   │   └── index.ts       # Entry point
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema
│   │   └── seed.ts        # Seed data script
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── types/         # TypeScript types
│   │   ├── App.tsx        # Main app component
│   │   └── main.tsx       # Entry point
│   └── package.json
├── docker-compose.yml
└── package.json           # Workspace root
```

## Scripts

### Root
- `npm run dev` - Start both backend and frontend
- `npm run docker:up` - Start Docker services
- `npm run docker:down` - Stop Docker services

### Backend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with test data
- `npm run db:studio` - Open Prisma Studio

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests

## Environment Variables

See `.env.example` files in backend and frontend directories for required environment variables.

## License

MIT
