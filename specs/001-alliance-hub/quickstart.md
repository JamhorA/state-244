# Quick Start: State 244 Hub – MVP

**Feature**: [spec.md](./spec.md)
**Date**: 2026-02-20
**Phase**: 1 - Design & Contracts

## Overview

This guide helps you get started with developing State 244 Hub MVP. It covers environment setup, database configuration, and running the development server.

---

## Prerequisites

Before starting, ensure you have:

- **Node.js** 20+ or 18+
- **pnpm** or **npm** (pnpm recommended for faster installs)
- **Git** for version control
- **Supabase account** (free tier sufficient for MVP)
- **OpenAI API key** (for AI text and image generation)
- **Netlify account** (for deployment)

---

## 1. Project Setup

### Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd server244

# Install dependencies
pnpm install
# or
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```bash
# Supabase (Get from Supabase Dashboard > Project Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI (Get from platform.openai.com)
OPENAI_API_KEY=sk-your-openai-key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Note**: Never commit `.env.local` to version control. Add it to `.gitignore`.

---

## 2. Supabase Setup

### Create a Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a region close to your users
3. Wait for the project to initialize (~2 minutes)

### Enable Required Services

In Supabase Dashboard, enable:

1. **Authentication**: Email provider (already enabled by default)
2. **Database**: PostgreSQL
3. **Realtime**: For chat and application status updates
4. **Storage**: For chat images and AI-generated images

### Create Storage Buckets

1. Go to **Storage** > **Create a new bucket**
2. Create `public` bucket for alliance logos (Public bucket)
3. Create `private` bucket for internal images (Private bucket)
4. Enable RLS for both buckets

### Run Database Migrations

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations from /supabase/migrations
supabase db push
```

Or manually run the SQL from `data-model.md` in the Supabase SQL Editor.

---

## 3. Development Server

### Start the Server

```bash
# Development mode with hot reload
pnpm dev
# or
npm run dev
```

The app will be available at `http://localhost:3000`

### Available Pages

**Public** (no auth required):
- `/` - Landing page with Top 3 Alliances
- `/alliances/[id]` - Alliance public profile
- `/apply/success` - Application success confirmation

**Internal** (auth required):
- `/dashboard` - Member dashboard
- `/chat` - Global "State 244 Diplomacy" chat
- `/applications` - R4/R5 application management
- `/alliance/edit` - R5 alliance profile editor
- `/alliance/members` - R5 member management
- `/ai/text` - R4/R5 AI text generator
- `/ai/image` - Member AI image generator

---

## 4. Database Seeding (Optional)

For development, seed the database with test data:

```bash
# Run seed script
pnpm seed
# or
npm run seed
```

This creates:
- 3 test alliances (rank 1-3)
- Test users with different roles
- Sample migration applications

---

## 5. Testing

### Run Tests

```bash
# Unit tests
pnpm test
# or
npm test

# E2E tests
pnpm test:e2e
# or
npm run test:e2e
```

### Test Coverage

```bash
pnpm test:coverage
```

---

## 6. Authentication Flow

### Public User
1. Visit `/` to see Top 3 Alliances
2. Click an alliance to view profile
3. Click "Apply" and submit migration application
4. See success confirmation

### Authenticated User
1. Visit `/login` (or click "Sign In" on any internal page)
2. Enter email → receive magic link
3. Click link in email → logged in
4. Access `/dashboard`, `/chat`, and other internal features

### R4/R5 Access
1. Log in with R4 or R5 credentials
2. Navigate to `/applications` to manage migration applications
3. Navigate to `/ai/text` (R4/R5) or `/ai/image` (Members) for AI tools

---

## 7. Realtime Subscriptions

The app uses Supabase Realtime for:

1. **Chat messages**: Instant delivery via Broadcast API
2. **Application status updates**: Real-time updates via Changes API

Example subscription (see `src/hooks/use-realtime.ts`):

```typescript
const { data: messages } = useRealtime<ChatMessage>(
  'chat_messages',
  {
    event: '*',
    filter: `room_name=eq.state-244-diplomacy`
  }
);
```

---

## 8. AI Integration

### Server-Side API Routes

All AI calls go through Next.js API routes:

- `/api/ai/text` - OpenAI GPT-4 for text generation
- `/api/ai/image` - OpenAI DALL-E 3 for image generation

API keys are stored in Netlify environment variables (never client-side).

### Rate Limiting

AI image generation is limited to 5 images per user per day (enforced in database).

---

## 9. Deployment

### Netlify Setup

1. **Connect repository**:
   - Go to Netlify > Add new site > Import from Git
   - Connect your GitHub repository

2. **Configure build settings**:
   ```
   Build command: npm run build
   Publish directory: .next
   ```

3. **Set environment variables**:
   - Go to Site settings > Environment variables
   - Add all variables from `.env.local`
   - **Do NOT** add `SUPABASE_SERVICE_ROLE_KEY` - use for server-side only

4. **Deploy**:
   - Netlify auto-deploys on git push
   - Or trigger manually from Netlify dashboard

### Production Checklist

- [ ] All environment variables configured in Netlify UI
- [ ] Database migrations applied to production Supabase
- [ ] Storage buckets created (public, private)
- [ ] RLS policies enabled and tested
- [ ] AI API keys added to Netlify environment
- [ ] Custom domain configured (optional)

---

## 10. Troubleshooting

### Common Issues

**Supabase connection error**:
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Check Supabase project is not paused

**AI API errors**:
- Verify `OPENAI_API_KEY` is valid
- Check API quota limits at platform.openai.com

**Realtime not working**:
- Ensure Realtime is enabled in Supabase Dashboard
- Check browser console for subscription errors

**RLS policy errors**:
- Verify policies are created in Supabase SQL Editor
- Test with `supabase.auth.signIn()` first

---

## 11. Development Resources

- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **OpenAI API**: https://platform.openai.com/docs
- **Netlify Docs**: https://docs.netlify.com

---

## 12. Next Steps

After completing the MVP setup:

1. **Run the development server**: `pnpm dev`
2. **Create test users**: Use Supabase Auth dashboard
3. **Test user flows**: Public discovery, auth, chat, AI tools
4. **Run tests**: `pnpm test`
5. **Deploy to Netlify**: Connect repository and deploy

For detailed implementation tasks, see `tasks.md` (generated by `/speckit.tasks`).
