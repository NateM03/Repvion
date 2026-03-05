# Repvion - Technical Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Database Schema & Data Models](#database-schema--data-models)
4. [Core Systems](#core-systems)
5. [File Structure & Responsibilities](#file-structure--responsibilities)
6. [Key Algorithms & Data Structures](#key-algorithms--data-structures)
7. [API Design](#api-design)
8. [Frontend Architecture](#frontend-architecture)
9. [Programming Practices & Patterns](#programming-practices--patterns)
10. [Future Enhancements](#future-enhancements)

---

## Project Overview

**Repvion** is a full-stack fitness application that combines personalized workout generation, social features, and gamification. The MVP focuses on:

- **Customizable Workout Plans**: Users select exercises for their chosen routine (PPL, Arnold, Upper/Lower, Full Body)
- **Workout Logging**: Track sets, reps, weight, and rest times during workouts
- **Gamification**: XP system, levels, streaks, and unlockable rewards
- **Social Features**: Follow friends, compete on leaderboards
- **Data-Driven Recommendations**: Foundation for AI-generated workouts based on user performance

---

## Architecture & Tech Stack

### Frontend
- **Next.js 14** (App Router) - React framework with server-side rendering
- **TypeScript** - Type safety and better developer experience
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **NextAuth.js** - Authentication and session management

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma ORM** - Type-safe database access
- **PostgreSQL** - Relational database
- **bcryptjs** - Password hashing

### Key Libraries
- `class-variance-authority` - Component variant management
- `lucide-react` - Icon library
- `tsx` - TypeScript execution for seed scripts

---

## Database Schema & Data Models

### Core Models

#### User
```typescript
{
  id: string (cuid)
  email: string (unique)
  username: string (unique)
  passwordHash: string
  createdAt: DateTime
  // Relations
  profile: UserProfile (1:1)
  stats: UserStats (1:1)
  plans: WorkoutPlan[] (1:many)
  workoutLogs: WorkoutLog[] (1:many)
  follows/followers: Follow[] (many:many via Follow table)
  userRewards: UserReward[] (1:many)
}
```

**Purpose**: Central user entity with authentication and relationships.

#### UserProfile
```typescript
{
  age: number
  heightCm: number (stored in cm, converted from feet/inches)
  weightKg: number (stored in kg, converted from lbs)
  sex: string
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  goal: 'build_muscle' | 'lose_weight' | 'strength' | 'endurance' | 'general_fitness'
  daysPerWeek: number (1-6)
  equipment: JSON array (e.g., ['dumbbells', 'barbell', 'bench'])
}
```

**Purpose**: Stores user preferences for workout generation. Equipment stored as JSON array for flexibility.

#### WorkoutPlan
```typescript
{
  id: string
  userId: string
  name: string (e.g., "Push/Pull/Legs (Custom)")
  goal: string (from profile)
  active: boolean (only one active at a time)
  createdAt: DateTime
  days: WorkoutDay[] (1:many)
}
```

**Purpose**: Container for a complete workout routine. Users can have up to 4 plans.

#### WorkoutDay
```typescript
{
  id: string
  workoutPlanId: string
  dayIndex: number (0-based, for ordering)
  title: string (e.g., "Push", "Chest & Back")
  exercises: WorkoutDayExercise[] (1:many)
  logs: WorkoutLog[] (1:many)
}
```

**Purpose**: Represents a single day in a workout plan. Can be repeated (e.g., PPL has 6 days: Push, Pull, Legs, Push, Pull, Legs).

#### WorkoutDayExercise
```typescript
{
  id: string
  workoutDayId: string
  exerciseId: string
  order: number (for sequencing)
  sets: number (user-defined, 0 initially)
  reps: string (user-defined, e.g., "8-12" or "10")
  restSeconds: number | null (user-defined)
}
```

**Purpose**: Links exercises to workout days with user-customized parameters. Sets/reps/rest are set by user when starting workout.

#### Exercise
```typescript
{
  id: string (cuid)
  name: string (e.g., "Incline Dumbbell Press")
  muscleGroup: string (e.g., "chest", "shoulders", "triceps")
  equipment: string (e.g., "dumbbells", "barbell", "cable_machine")
}
```

**Purpose**: Exercise database. Currently 100+ exercises with variations (incline, decline, seated, standing, etc.).

#### WorkoutLog
```typescript
{
  id: string
  userId: string
  workoutDayId: string | null
  date: DateTime
  completed: boolean
  exerciseLogs: ExerciseLog[] (1:many)
}
```

**Purpose**: Records a completed workout session. One log per workout day per day.

#### ExerciseLog
```typescript
{
  id: string
  workoutLogId: string
  exerciseId: string
  setNumber: number (1, 2, 3, ...)
  weight: number | null (in lbs, converted from user input)
  reps: number (actual reps completed)
}
```

**Purpose**: Stores actual performance data (weight/reps) for each set. Used for analytics and future recommendations.

#### UserStats
```typescript
{
  id: string
  userId: string (unique)
  totalXp: number
  level: number (calculated from totalXp)
  currentStreak: number (consecutive workout days)
  longestStreak: number
  workoutsThisWeek: number
  lastWorkoutDate: DateTime | null
}
```

**Purpose**: Tracks gamification metrics. Updated on every workout completion.

#### Reward & UserReward
```typescript
Reward {
  id: string
  name: string (e.g., "Starter Avatar")
  type: string ('avatar' | 'badge' | 'medal')
  requiredLevel: number | null
  requiredStreak: number | null
}

UserReward {
  userId: string
  rewardId: string
  unlockedAt: DateTime
  equipped: boolean (for avatars)
}
```

**Purpose**: Gamification rewards system. Unlocks automatically when thresholds are met.

#### Follow
```typescript
{
  id: string
  followerId: string
  followingId: string
  createdAt: DateTime
  @@unique([followerId, followingId])
}
```

**Purpose**: Many-to-many relationship for social following. Self-referential on User model.

---

## Core Systems

### 1. Authentication System (`lib/auth.ts`)

**Implementation**: NextAuth.js with Credentials provider

**Flow**:
1. User registers → password hashed with bcrypt (10 rounds)
2. Login → credentials validated against database
3. Session stored as JWT token
4. Protected routes use middleware to check authentication

**Key Features**:
- Password hashing with bcryptjs
- JWT-based sessions (stateless)
- Custom session callbacks to include user ID and username

**Security**:
- Passwords never stored in plain text
- Session tokens signed with NEXTAUTH_SECRET
- Middleware protects routes automatically

### 2. XP & Leveling System (`lib/xp.ts`)

**XP Values**:
```typescript
WORKOUT_COMPLETED: 50 XP
WORKOUT_WITH_SETS: 20 XP (bonus)
STREAK_7_DAYS: 150 XP (bonus)
```

**Level Calculation Algorithm**:
```typescript
function calculateLevel(totalXp: number): number {
  // Binary search-like approach: iterate backwards through thresholds
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) {
      return i + 1  // Level is index + 1
    }
  }
  return 1  // Default to level 1
}
```

**Level Thresholds** (exponential progression):
- Level 1: 0 XP
- Level 2: 500 XP
- Level 3: 1,200 XP
- Level 4: 2,400 XP
- Level 5: 4,000 XP
- ...continues to Level 10: 20,000 XP

**Streak Tracking Algorithm**:
```typescript
1. Get last workout date
2. Calculate days since last workout
3. If daysDiff === 1: increment streak (consecutive)
4. If daysDiff > 1: reset streak to 1 (broken)
5. If daysDiff === 0: don't change (same day)
6. Update longestStreak if current > longest
```

**Reward Unlocking**:
- Triggered after XP/streak updates
- Queries rewards where `requiredLevel <= userLevel` OR `requiredStreak <= userStreak`
- Creates UserReward entry if not already unlocked
- Prevents duplicate unlocks with unique constraint

### 3. Workout Generator (`lib/generator.ts`)

**Design Pattern**: Strategy Pattern (different generators for different routines)

**Routine Types**:
1. **Full Body** (3 days): A/B/C rotation, targets all muscle groups each day
2. **Upper/Lower** (4 days): Alternates upper and lower body
3. **Push/Pull/Legs** (6 days): Push (chest/shoulders/triceps), Pull (back/biceps), Legs
4. **Arnold Split** (6 days): Chest & Back, Shoulders & Arms, Legs

**Generation Algorithm**:
```typescript
1. Fetch user profile (equipment, goal, experience)
2. Filter exercises by available equipment
3. Group exercises by muscle group
4. Select exercises based on routine type
5. Order exercises (compound movements first)
6. Set default sets/reps/rest (user will customize later)
7. Create WorkoutPlan with WorkoutDays and WorkoutDayExercises
```

**Exercise Selection Logic**:
- Filters by equipment availability
- Groups by muscle group (chest, back, shoulders, etc.)
- Selects top N exercises per muscle group
- Orders by importance (compound movements prioritized)

**Custom Plan Support**:
- Users can select exercises manually
- System accepts custom exercise arrays
- Bypasses auto-generation when custom days provided

### 4. Workout Logging System

**Two-Phase Approach**:

**Phase 1: Planning** (optional, can be done during workout)
- User sets: Sets, Target Reps, Rest Time
- Stored in `WorkoutDayExercise` table
- Can be updated anytime

**Phase 2: Logging** (during workout)
- User logs: Weight (lbs), Actual Reps for each set
- Stored in `ExerciseLog` table
- Each set is a separate record

**Data Flow**:
```
User starts workout
  ↓
Sets planned sets/reps/rest (optional)
  ↓
Logs weight and reps for each set
  ↓
Completes workout
  ↓
Data saved:
  - WorkoutDayExercise updated (sets/reps/rest)
  - ExerciseLog created (weight/reps per set)
  - WorkoutLog marked as completed
  - XP awarded
  - Streak updated
  - Rewards checked
```

---

## File Structure & Responsibilities

### `/app` - Next.js App Router

#### `/app/api` - API Routes (Backend)

**`/api/auth/[...nextauth]/route.ts`**
- NextAuth handler for authentication
- Exports GET and POST handlers

**`/api/auth/register/route.ts`**
- User registration endpoint
- Validates email/username uniqueness
- Hashes password with bcrypt
- Creates User + UserStats records

**`/api/me/route.ts`**
- Returns current user profile and stats
- Protected route (requires authentication)

**`/api/me/profile/route.ts`**
- Updates user profile (onboarding)
- Uses upsert to create or update
- Validates required fields

**`/api/plans/generate/route.ts`**
- Creates new workout plan
- Checks plan limit (max 4)
- Accepts custom exercises or uses generator
- Creates plan as inactive initially

**`/api/plans/active/route.ts`**
- Returns user's active workout plan
- Includes all days and exercises

**`/api/plans/route.ts`**
- GET: Returns all user's plans
- Used for plan management page

**`/api/plans/[id]/route.ts`**
- DELETE: Deletes a plan
- Verifies ownership before deletion

**`/api/plans/[id]/activate/route.ts`**
- POST: Sets a plan as active
- Deactivates all other plans (only one active at a time)

**`/api/workouts/today/route.ts`**
- Returns today's workout based on active plan
- Calculates which day of the cycle to show
- Checks if already completed today

**`/api/workouts/day/[dayId]/route.ts`**
- Returns workout day details with exercises
- Used for workout logging page

**`/api/workouts/[dayId]/log/route.ts`**
- POST: Logs completed workout
- Updates WorkoutDayExercise with planned sets/reps/rest
- Creates ExerciseLog entries for each set
- Awards XP and updates streaks
- Prevents duplicate logs for same day

**`/api/exercises/route.ts`**
- GET: Returns exercises
- Supports filtering by muscleGroup and equipment
- Supports search by name (case-insensitive)

**`/api/social/follow/route.ts`**
- POST: Follow a user
- Creates Follow relationship
- Prevents self-follow and duplicates

**`/api/social/unfollow/route.ts`**
- POST: Unfollow a user
- Deletes Follow relationship

**`/api/social/following/route.ts`**
- GET: Returns list of users being followed

**`/api/leaderboard/route.ts`**
- GET: Returns ranked users
- Supports 'friends' or 'global' scope
- Orders by workoutsThisWeek, then totalXp

**`/api/rewards/route.ts`**
- GET: Returns all rewards
- Includes unlock status for current user

**`/api/rewards/[id]/equip/route.ts`**
- POST: Equips a reward (avatar)
- Unequips other avatars of same type

#### `/app` - Pages (Frontend)

**`/app/page.tsx`** - Landing Page
- Marketing/hero page
- Links to login/register
- Feature highlights

**`/app/auth/login/page.tsx`** - Login Page
- Email/password form
- Uses NextAuth signIn
- Redirects to dashboard on success

**`/app/auth/register/page.tsx`** - Registration Page
- Email, username, password form
- Calls `/api/auth/register`
- Redirects to login after registration

**`/app/onboarding/page.tsx`** - Profile Setup
- Collects: age, height (feet/inches), weight (lbs), sex, experience, goal, days/week, equipment
- Converts to metric (cm, kg) for storage
- Two equipment options: Public Gym or Home Gym (Limited)

**`/app/dashboard/page.tsx`** - Main Dashboard
- Shows today's workout
- Displays XP bar, streak, weekly stats
- "Start Workout" button → workout logging page
- Quick actions (Manage Plans, Leaderboard, Settings)

**`/app/plans/page.tsx`** - Plan Management
- Lists all user's plans (up to 4)
- Shows active plan
- Create new plan → routine selection
- Delete plans
- Activate/deactivate plans

**`/app/plans/build/page.tsx`** - Exercise Selection
- Shows routine-specific muscle groups
- Searchable exercise database
- Users select exercises per muscle group
- Creates plan with selected exercises

**`/app/workouts/[dayId]/page.tsx`** - Workout Logging
- Two modes: Planning (sets/reps/rest) and Logging (weight/reps)
- Users can set parameters as they go
- Logs each set with weight and reps
- Saves to database on completion

**`/app/leaderboard/page.tsx`** - Leaderboard
- Toggle between Friends and Global
- Shows rank, username, level, workouts, streak
- Follow/unfollow buttons

**`/app/settings/page.tsx`** - Settings
- View unlocked rewards
- Equip avatars
- See all rewards (locked/unlocked)

### `/components` - Reusable Components

**`/components/ui/`** - Base UI Components
- `button.tsx` - Button with variants (default, outline, ghost, etc.)
- `card.tsx` - Card container with header/content/footer
- `badge.tsx` - Badge component for tags
- `avatar.tsx` - Avatar with fallback

**`/components/WorkoutCard.tsx`**
- Displays workout day with exercises
- Shows exercise list
- "Quick Complete" button (no logging)

**`/components/ExerciseRow.tsx`**
- Displays single exercise
- Shows muscle group and equipment tags
- Displays sets/reps/rest (if set)

**`/components/XPBar.tsx`**
- Visual progress bar for XP
- Shows current level and XP to next level
- Calculates progress percentage

**`/components/Leaderboard.tsx`**
- Renders leaderboard entries
- Shows rank, user info, stats
- Follow/unfollow functionality

**`/components/StreakPill.tsx`**
- Displays current streak with flame icon
- Shows longest streak

### `/lib` - Core Logic

**`lib/prisma.ts`**
- Prisma client singleton
- Prevents multiple instances in development
- Global instance for hot reloading

**`lib/auth.ts`**
- NextAuth configuration
- Credentials provider setup
- Session/JWT callbacks

**`lib/xp.ts`**
- XP calculation and awarding
- Level calculation algorithm
- Streak tracking logic
- Reward unlock checking

**`lib/generator.ts`**
- Workout plan generation
- Routine-specific generators
- Exercise selection algorithms
- Custom plan support

**`lib/utils.ts`**
- Utility functions (cn for className merging)

### `/prisma` - Database

**`prisma/schema.prisma`**
- Complete database schema
- All models and relationships
- Constraints and indexes

**`prisma/seed.ts`**
- Database seeding script
- Creates 100+ exercises
- Creates rewards
- Creates sample users with profiles

### Configuration Files

**`package.json`**
- Dependencies and scripts
- Database commands (db:generate, db:push, db:seed)

**`tsconfig.json`**
- TypeScript configuration
- Path aliases (@/*)

**`tailwind.config.ts`**
- Tailwind CSS configuration
- Custom theme colors
- Component variants

**`next.config.js`**
- Next.js configuration
- Server actions enabled

**`middleware.ts`**
- Route protection
- Redirects unauthenticated users

---

## Key Algorithms & Data Structures

### 1. Level Calculation

**Algorithm**: Reverse Linear Search
```typescript
// Time Complexity: O(n) where n = number of level thresholds
// Space Complexity: O(1)

function calculateLevel(totalXp: number): number {
  // Iterate backwards through thresholds
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) {
      return i + 1
    }
  }
  return 1
}
```

**Why this approach?**
- Simple and readable
- Thresholds are small array (10 items)
- Could optimize with binary search if thresholds grow large

### 2. Streak Tracking

**Algorithm**: Date Difference Calculation
```typescript
// Time Complexity: O(1)
// Space Complexity: O(1)

1. Get last workout date (or null)
2. Calculate days difference:
   daysDiff = floor((today - lastWorkout) / millisecondsPerDay)
3. If daysDiff === 1: streak continues
4. If daysDiff > 1: streak broken, reset to 1
5. If daysDiff === 0: same day, don't change
```

**Edge Cases Handled**:
- First workout ever (lastWorkoutDate is null)
- Same day multiple workouts
- Timezone considerations (using setHours to normalize)

### 3. Exercise Filtering & Grouping

**Data Structure**: Hash Map / Object
```typescript
// Groups exercises by muscle group
const grouped: Record<string, Exercise[]> = {}
exercises.forEach(ex => {
  const mg = ex.muscleGroup.toLowerCase()
  if (!grouped[mg]) grouped[mg] = []
  grouped[mg].push(ex)
})
```

**Time Complexity**: O(n) where n = number of exercises
**Space Complexity**: O(n)

### 4. Workout Day Rotation

**Algorithm**: Modulo Arithmetic
```typescript
// Determines which day of a plan to show today
const daysSinceStart = floor((today - plan.createdAt) / millisecondsPerDay)
const dayIndex = daysSinceStart % plan.days.length
```

**Example**: 
- Plan has 3 days (Push, Pull, Legs)
- Day 0: Push, Day 1: Pull, Day 2: Legs
- Day 3: Push (cycle repeats)

### 5. Leaderboard Ranking

**Algorithm**: Multi-field Sorting
```typescript
// Orders by:
1. workoutsThisWeek (descending)
2. totalXp (descending) - tiebreaker

// SQL equivalent:
ORDER BY workoutsThisWeek DESC, totalXp DESC
```

**Time Complexity**: O(n log n) - database sorting
**Space Complexity**: O(n) - result set

### 6. Reward Unlocking

**Algorithm**: Set Intersection
```typescript
1. Query rewards where:
   (requiredLevel <= userLevel) OR (requiredStreak <= userStreak)
2. For each matching reward:
   - Check if already unlocked (unique constraint)
   - If not, create UserReward entry
```

**Optimization**: Uses Prisma's `OR` query to filter in database rather than in application code.

---

## API Design

### RESTful Conventions

**Endpoints follow REST principles**:
- `GET /api/plans` - List resources
- `GET /api/plans/active` - Get specific resource
- `POST /api/plans/generate` - Create resource
- `DELETE /api/plans/[id]` - Delete resource
- `POST /api/plans/[id]/activate` - Action on resource

### Authentication Pattern

**All protected endpoints**:
1. Check for session via `getServerSession(authOptions)`
2. Return 401 if unauthorized
3. Verify resource ownership (for user-specific resources)
4. Return 403 if user doesn't own resource

### Error Handling

**Consistent error responses**:
```typescript
{
  error: string  // Human-readable error message
}
```

**Status Codes**:
- 200: Success
- 201: Created
- 400: Bad Request (validation errors)
- 401: Unauthorized (not logged in)
- 403: Forbidden (no permission)
- 404: Not Found
- 500: Internal Server Error

### Data Validation

**Client-side**: Form validation in React components
**Server-side**: Type checking and required field validation
**Database**: Prisma schema enforces types and constraints

---

## Frontend Architecture

### State Management

**Pattern**: Local Component State + Server State
- React `useState` for UI state
- `useSession` from NextAuth for auth state
- Fetch on mount/action for server data

**No global state library** (Redux, Zustand) - not needed for MVP scope

### Component Patterns

**1. Container/Presentational Pattern**:
- Pages are containers (fetch data, handle actions)
- Components are presentational (display data, emit events)

**2. Compound Components**:
- Card with CardHeader, CardContent, CardFooter
- Flexible composition

**3. Controlled Components**:
- All form inputs are controlled (value + onChange)
- Single source of truth

### Routing

**Next.js App Router**:
- File-based routing
- Dynamic routes: `[dayId]`, `[id]`
- Route groups for organization

### Styling Approach

**Tailwind CSS Utility Classes**:
- No separate CSS files
- Responsive design with breakpoint prefixes (md:, lg:)
- Dark mode support (prepared but not implemented)

**Component Variants**:
- Using `class-variance-authority` for button/card variants
- Type-safe variant props

---

## Programming Practices & Patterns

### 1. Type Safety

**TypeScript throughout**:
- All functions have type annotations
- Interfaces for component props
- Prisma generates types from schema

**Benefits**:
- Catch errors at compile time
- Better IDE autocomplete
- Self-documenting code

### 2. Error Handling

**Try-Catch Blocks**:
- All async operations wrapped
- User-friendly error messages
- Console logging for debugging

**Example Pattern**:
```typescript
try {
  const response = await fetch(...)
  if (!response.ok) {
    const error = await response.json()
    setError(error.error || 'Operation failed')
    return
  }
  // Success handling
} catch (error) {
  console.error('Error:', error)
  setError('An error occurred')
}
```

### 3. Database Transactions

**Prisma Best Practices**:
- Use `createMany` for bulk inserts
- Use `updateMany` for bulk updates
- Cascade deletes configured in schema
- Unique constraints prevent duplicates

### 4. Security Practices

**Password Security**:
- bcrypt hashing (10 rounds)
- Never store plain text
- Never return passwordHash in API responses

**Authentication**:
- JWT tokens signed with secret
- Session validation on every request
- Middleware protects routes

**Authorization**:
- Verify resource ownership
- Check user permissions
- Prevent self-actions (e.g., following yourself)

### 5. Code Organization

**Separation of Concerns**:
- `/lib` - Business logic
- `/app/api` - API endpoints
- `/app` - Pages/UI
- `/components` - Reusable UI

**Single Responsibility**:
- Each file has one clear purpose
- Functions do one thing
- Components are focused

### 6. Performance Optimizations

**Database Queries**:
- Use `include` to fetch related data in one query
- Avoid N+1 queries
- Index on frequently queried fields (userId, active)

**Frontend**:
- Lazy loading (Next.js handles this)
- Conditional rendering
- Memoization not needed yet (small data sets)

### 7. Data Conversion

**User Input → Database Storage**:
- Height: feet/inches → centimeters
- Weight: pounds → kilograms
- Equipment: array → JSON

**Why store in metric?**
- Consistent units across all users
- Easier calculations
- International standard

### 8. State Management Patterns

**Optimistic Updates** (not implemented yet, but prepared):
- Could update UI before API response
- Rollback on error

**Current Approach**:
- Fetch → Update → Refetch
- Simple and reliable
- Good for MVP

---

## Key Design Decisions

### 1. Why Custom Exercise Selection?

**Decision**: Let users choose exercises instead of auto-generating

**Rationale**:
- Users know what equipment they have
- Users have preferences
- Builds engagement (ownership)
- Foundation for AI recommendations (learn from choices)

### 2. Why Two-Phase Workout (Planning + Logging)?

**Decision**: Separate planning from logging

**Rationale**:
- Users might forget to plan beforehand
- Can set parameters during workout
- Flexible workflow
- Data collection for both planned and actual performance

### 3. Why Store Sets/Reps/Rest in WorkoutDayExercise?

**Decision**: Store in join table, not separate table

**Rationale**:
- Each exercise in a plan can have different parameters
- Same exercise in different plans can have different sets/reps
- Normalized data structure
- Easy to update

### 4. Why Limit to 4 Plans?

**Decision**: Hard limit on number of plans

**Rationale**:
- Prevents database bloat
- Encourages users to maintain active plans
- UI stays manageable
- Can be increased later if needed

### 5. Why JWT Sessions?

**Decision**: Stateless JWT over database sessions

**Rationale**:
- Scalable (no session store needed)
- Works with serverless (Vercel)
- Simpler architecture
- Trade-off: Can't revoke sessions easily (acceptable for MVP)

### 6. Why PostgreSQL?

**Decision**: PostgreSQL over MongoDB or SQLite

**Rationale**:
- Relational data (users, plans, exercises, logs)
- Complex queries (leaderboards, analytics)
- ACID compliance
- Prisma support
- Free tier available (Neon, Supabase)

---

## Data Flow Examples

### Creating a Workout Plan

```
1. User selects routine (PPL)
   ↓
2. Navigate to /plans/build?routine=ppl
   ↓
3. User searches and selects exercises
   ↓
4. Click "Create Workout Plan"
   ↓
5. POST /api/plans/generate
   - Validates user has < 4 plans
   - Creates WorkoutPlan (inactive)
   - Creates WorkoutDays (6 days for PPL)
   - Creates WorkoutDayExercises (with sets=0, reps='')
   ↓
6. POST /api/plans/[id]/activate
   - Deactivates other plans
   - Activates new plan
   ↓
7. Redirect to dashboard
```

### Completing a Workout

```
1. User clicks "Start Workout"
   ↓
2. Navigate to /workouts/[dayId]
   ↓
3. User sets sets/reps/rest (optional)
   ↓
4. User logs weight and reps for each set
   ↓
5. Click "Complete Workout"
   ↓
6. POST /api/workouts/[dayId]/log
   - Updates WorkoutDayExercise (sets/reps/rest)
   - Creates WorkoutLog (completed=true)
   - Creates ExerciseLog entries (weight/reps per set)
   ↓
7. Award XP
   - Calculate XP from actions
   - Update UserStats (totalXp, level, streak)
   ↓
8. Check Rewards
   - Query eligible rewards
   - Create UserReward if not exists
   ↓
9. Redirect to dashboard
```

### Leaderboard Calculation

```
1. User navigates to /leaderboard?scope=friends
   ↓
2. GET /api/leaderboard?scope=friends
   ↓
3. Query Follow table for user's following list
   ↓
4. Query UserStats where userId IN (followingIds + self)
   ↓
5. ORDER BY workoutsThisWeek DESC, totalXp DESC
   ↓
6. Return ranked list with user info
   ↓
7. Display in Leaderboard component
```

---

## Future Enhancements (V2)

### Analytics System
- Track strength progression over time
- Volume calculations (sets × reps × weight)
- Personal records (PRs)
- Charts and graphs

### AI Recommendations
- After 1 week of data, analyze patterns
- Suggest optimal sets/reps based on performance
- Recommend weight progression
- Suggest exercise substitutions

### Advanced Features
- Workout templates (save favorite plans)
- Exercise notes/comments
- Rest timer (countdown)
- Workout history with filters
- Export data (CSV/JSON)
- Mobile app (React Native)

---

## Testing Strategy (Not Yet Implemented)

### Unit Tests
- `lib/xp.ts` - XP calculation, level progression
- `lib/generator.ts` - Plan generation logic
- Streak calculation edge cases

### Integration Tests
- API endpoints with test database
- Authentication flows
- Workout logging flow

### E2E Tests (Planned)
- Complete user journey: Register → Onboard → Create Plan → Log Workout
- Social features: Follow → Leaderboard
- Reward unlocking

---

## Deployment Considerations

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - Application URL
- `NEXTAUTH_SECRET` - JWT signing secret

### Database Migrations
- Use `prisma migrate` for production
- `prisma db push` for development only

### Performance
- Database indexes on frequently queried fields
- Consider caching for leaderboards (Redis)
- Image optimization if avatars added

### Security
- Rate limiting on API endpoints (future)
- Input sanitization (Prisma handles SQL injection)
- CORS configuration for production

---

## Common Patterns Used

### 1. Upsert Pattern
```typescript
await prisma.userProfile.upsert({
  where: { userId },
  update: { ... },
  create: { ... }
})
```
Used for: UserProfile (create or update)

### 2. Bulk Operations
```typescript
await prisma.exerciseLog.createMany({
  data: exerciseLogsArray
})
```
Used for: Creating multiple exercise logs at once

### 3. Conditional Updates
```typescript
await prisma.workoutPlan.updateMany({
  where: { userId, active: true },
  data: { active: false }
})
```
Used for: Deactivating all plans before activating one

### 4. Include Pattern
```typescript
const plan = await prisma.workoutPlan.findUnique({
  include: {
    days: {
      include: {
        exercises: {
          include: { exercise: true }
        }
      }
    }
  }
})
```
Used for: Fetching related data in one query

---

## Code Quality Metrics

### Type Coverage
- 100% TypeScript
- All functions typed
- Prisma generates types

### Error Handling
- All async operations wrapped
- User-friendly messages
- Console logging for debugging

### Code Reusability
- UI components in `/components/ui`
- Business logic in `/lib`
- Consistent patterns

### Maintainability
- Clear file structure
- Descriptive names
- Comments where needed
- Separation of concerns

---

## Learning Resources for Understanding

### Prisma
- Official docs: https://www.prisma.io/docs
- Key concepts: Schema, Migrations, Relations, Queries

### Next.js App Router
- Official docs: https://nextjs.org/docs
- Key concepts: Server Components, API Routes, Middleware

### NextAuth.js
- Official docs: https://next-auth.js.org
- Key concepts: Providers, Callbacks, Sessions

### TypeScript
- Official docs: https://www.typescriptlang.org/docs
- Key concepts: Types, Interfaces, Generics

---

## Summary

**Repvion** is a well-structured, type-safe full-stack application built with modern best practices:

- **Scalable Architecture**: Next.js App Router, Prisma ORM, PostgreSQL
- **Type Safety**: TypeScript throughout
- **Security**: Password hashing, JWT sessions, authorization checks
- **User Experience**: Flexible workout planning, real-time logging
- **Gamification**: XP system, levels, streaks, rewards
- **Social Features**: Following, leaderboards
- **Data Foundation**: Ready for AI recommendations after data collection

The codebase follows separation of concerns, uses consistent patterns, and is structured for easy maintenance and future enhancements.

