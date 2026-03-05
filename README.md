# Repvion - Forge Your Strength

Repvion is a full-stack fitness application that generates personalized workout plans, tracks progress with gamification (XP, levels, streaks), and includes social features like following friends and leaderboards.

## Features

- **Personalized Workout Plans**: AI-generated workout plans based on your profile (experience level, goals, available equipment, days per week)
- **Progress Tracking**: Log workouts, build streaks, and earn XP
- **Gamification**: Level up, unlock rewards, and equip avatars
- **Social Features**: Follow friends, compete on leaderboards
- **Reward System**: Unlock badges, avatars, and medals based on achievements

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Server Actions
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **UI Components**: Radix UI, shadcn/ui

## Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database (local or cloud like Neon, Supabase, PlanetScale)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/repvion?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"
```

To generate a secure `NEXTAUTH_SECRET`, run:
```bash
openssl rand -base64 32
```

### 3. Set Up Database

```bash
# Generate Prisma Client
npm run db:generate

# Run migrations (creates database schema)
npm run db:migrate

# Or use db:push for development (faster, but doesn't create migration files)
npm run db:push

# Seed the database with sample data
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The application uses the following main models:

- **User**: Authentication and basic user info
- **UserProfile**: Age, height, weight, experience, goals, equipment
- **WorkoutPlan**: Generated workout plans
- **WorkoutDay**: Individual workout days within a plan
- **Exercise**: Exercise database
- **WorkoutLog**: Completed workout sessions
- **UserStats**: XP, level, streak tracking
- **Reward**: Unlockable rewards (avatars, badges, medals)
- **Follow**: Social following relationships

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (via NextAuth)
- `GET /api/me` - Get current user profile

### Profile
- `PUT /api/me/profile` - Update user profile

### Workout Plans
- `POST /api/plans/generate` - Generate new workout plan
- `GET /api/plans/active` - Get active workout plan

### Workouts
- `GET /api/workouts/today` - Get today's workout
- `POST /api/workouts/[dayId]/log` - Log completed workout

### Social
- `POST /api/social/follow` - Follow a user
- `POST /api/social/unfollow` - Unfollow a user
- `GET /api/social/following` - Get list of followed users
- `GET /api/leaderboard?scope=friends|global` - Get leaderboard

### Rewards
- `GET /api/rewards` - Get all rewards (with unlock status)
- `POST /api/rewards/[id]/equip` - Equip a reward (avatar)

## User Flow

1. **Register** → Create account at `/auth/register`
2. **Onboard** → Complete profile at `/onboarding` (age, height, weight, experience, goals, equipment)
3. **Generate Plan** → Create personalized workout plan at `/plans`
4. **Workout** → View today's workout on dashboard, mark as completed
5. **Progress** → Earn XP, build streaks, level up
6. **Social** → Follow friends, compete on leaderboard
7. **Rewards** → Unlock and equip avatars/badges at `/settings`

## XP System

- **Workout Completed**: +50 XP
- **Workout with Sets Logged**: +20 XP (bonus)
- **7-Day Streak**: +150 XP (bonus)

Level thresholds:
- Level 1: 0 XP
- Level 2: 500 XP
- Level 3: 1,200 XP
- Level 4: 2,400 XP
- Level 5: 4,000 XP
- ... (continues)

## Workout Plan Types

Based on days per week:
- **3 days**: Full Body (A/B/C rotation)
- **4 days**: Upper/Lower Split
- **5-6 days**: Push/Pull/Legs (PPL)

Plans are generated based on:
- Experience level (beginner/intermediate/advanced)
- Goal (build muscle, strength, endurance, etc.)
- Available equipment
- Days per week preference

## Seed Data

The seed script creates:
- 12+ exercises (Squat, Deadlift, Bench Press, etc.)
- 6 rewards (avatars, badges, medals)
- 3 sample users (alice, bob, carol) with profiles and stats

Default password for seed users: `password123`

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database commands
npm run db:generate  # Generate Prisma Client
npm run db:push      # Push schema changes (dev)
npm run db:migrate   # Create and run migrations
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio (database GUI)
```

## Project Structure

```
repvion/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main dashboard
│   ├── onboarding/        # Profile setup
│   ├── plans/             # Workout plan management
│   ├── leaderboard/       # Social leaderboard
│   └── settings/           # User settings & rewards
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── ...               # Feature components
├── lib/                   # Utility functions
│   ├── prisma.ts         # Prisma client
│   ├── auth.ts           # NextAuth config
│   ├── xp.ts             # XP & level system
│   └── generator.ts      # Workout plan generator
├── prisma/                # Database
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed script
└── ...
```

## Deployment

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Database Options

- **Neon**: Serverless PostgreSQL (free tier available)
- **Supabase**: PostgreSQL with additional features
- **PlanetScale**: MySQL-compatible (if switching from PostgreSQL)
- **Railway**: Easy PostgreSQL hosting

## Future Enhancements (V2)

- Progress charts (weight/XP over time)
- Challenges & notifications
- In-app chat/comments
- Admin CRUD for exercises and rewards
- Mobile optimizations / PWA
- Meal planning integration

## License

MIT

## Contributing

Contributions welcome! Please open an issue or submit a pull request.
