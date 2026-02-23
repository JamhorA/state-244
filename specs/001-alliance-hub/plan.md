# Implementation Plan: State 244 Hub – MVP

**Branch**: `001-alliance-hub` | **Date**: 2026-02-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-alliance-hub/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

State 244 Hub is a web platform for alliance management in a gaming state, featuring public alliance discovery, migration applications, internal real-time communication, and AI-powered content generation. The MVP focuses on the Top 3 Alliances only, with a single global chat room and server-side AI integration. Technical approach uses Next.js with TypeScript for the frontend, Supabase for authentication, database, realtime, and storage, and a server-side AI API integration for text and image generation. Public/internal separation is enforced through authentication and role-based access control.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 16 (App Router)
**Primary Dependencies**: Next.js 16, React 19, Supabase (Auth, Database, Realtime, Storage), @supabase/supabase-js, AI API provider (client libraries for server-side)
**Storage**: Supabase PostgreSQL + Supabase Storage (separate public and private buckets)
**Testing**: Jest + React Testing Library (unit), Playwright (E2E)
**Target Platform**: Web (modern browsers), deployed to Netlify
**Project Type**: web (single full-stack application with App Router)
**Performance Goals**: 1,000 concurrent users, <1 second chat latency, <2 second realtime updates for application status
**Constraints**: Server-side AI API keys only, public/internal separation enforced, AI rate limiting (5 images/user/day), single global chat room only
**Scale/Scope**: ~15-20 pages/routes, 6 core entities, 1,000 user capacity, Top 3 Alliances only

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Compliance Status: PASS

| Principle | Requirement | Status | Notes |
|-----------|--------------|--------|-------|
| I. Ship Fast, Stay Stable | MVP-first, deployable within one day | ✅ PASS | Single global chat, Top 3 only, no over-engineering |
| II. Public vs Internal Separation | Public: view, apply only | ✅ PASS | Auth required for internal features, AI images internal-only |
| III. Role Governance | Public, Member, R4, R5 with enforced permissions | ✅ PASS | Role-based access control planned in data model |
| IV. AI Usage | Text drafts internal-only, images rate-limited, server-side keys | ✅ PASS | Server-side API routes for AI, rate limiting in database |
| V. Realtime Principles | Single global room, text + images, auth required | ✅ PASS | "State 244 Diplomacy" room only, Supabase Realtime |
| Security & Abuse | Rate limiting, honeypot, audit trails | ✅ PASS | Supabase RLS policies, rate limiting middleware |

### No Complexity Tracking Required
All principles are compliant without complexity violations.

## Project Structure

### Documentation (this feature)

```text
specs/001-alliance-hub/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── api.yaml        # OpenAPI specification
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── app/                          # Next.js App Router
│   ├── (public)/                  # Public routes (no auth required)
│   │   ├── page.tsx             # Landing page - Top 3 Alliances
│   │   ├── alliances/
│   │   │   └── [id]/
│   │   │       └── page.tsx     # Alliance public profile + apply form
│   │   └── apply/
│   │       └── success.tsx      # Application success page
│   ├── (internal)/               # Authenticated routes only
│   │   ├── layout.tsx           # Auth check middleware
│   │   ├── dashboard/
│   │   │   └── page.tsx       # Member dashboard
│   │   ├── chat/
│   │   │   └── page.tsx       # Global "State 244 Diplomacy" chat
│   │   ├── applications/         # R4/R5 only
│   │   │   └── page.tsx       # Application management
│   │   ├── alliance/            # R5 only
│   │   │   ├── edit/
│   │   │   │   └── page.tsx   # Edit alliance profile
│   │   │   └── members/
│   │   │       └── page.tsx   # Member role management
│   │   └── ai/
│   │       ├── text/
│   │       │   └── page.tsx   # AI text generator (R4/R5)
│   │       └── image/
│   │           └── page.tsx   # AI image generator (Members)
│   ├── api/                     # API routes (server-side)
│   │   ├── auth/
│   │   │   └── callback/      # Supabase auth callback
│   │   ├── applications/         # Application API
│   │   │   ├── route.ts        # POST submit (public, rate-limited)
│   │   │   └── [id]/
│   │   │       └── route.ts    # PATCH update status (R4/R5)
│   │   ├── ai/
│   │   │   ├── text/
│   │   │   │   └── route.ts   # POST generate text (R4/R5)
│   │   │   └── image/
│   │   │       └── route.ts   # POST generate image (Members)
│   │   └── chat/
│   │       └── route.ts        # Webhook for realtime
│   └── lib/
│       ├── supabase.ts         # Supabase client config
│       ├── auth.ts            # Auth utilities
│       └── ai.ts              # AI API integration (server-side)
├── components/
│   ├── ui/                    # Reusable UI components
│   ├── forms/                 # Form components
│   ├── chat/                  # Chat components
│   └── alliance/              # Alliance display components
├── hooks/
│   ├── use-auth.ts            # Authentication hook
│   ├── use-realtime.ts        # Realtime subscription hook
│   └── use-role.ts           # Role-based access hook
└── types/
    └── index.ts               # TypeScript types

public/                         # Static assets
└── images/

tests/                          # Test files
├── unit/                      # Jest unit tests
├── integration/               # Integration tests
└── e2e/                     # Playwright E2E tests
```

**Structure Decision**: Single Next.js application with App Router structure. The `(public)` and `(internal)` route groups provide clear separation between public and authenticated pages. All AI API calls go through Next.js API routes to keep API keys server-side. Supabase handles all data persistence, authentication, and realtime features. This single-project approach aligns with the constitution's "Ship Fast, Stay Stable" principle by avoiding unnecessary separation between frontend and backend.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No complexity violations. All principles are compliant with a single, streamlined Next.js application.

---

## Phase 0: Research

**Status**: ✅ Complete

Research findings consolidated in [research.md](./research.md).

**Key Decisions**:
- Next.js 16 with TypeScript and App Router
- Supabase for Auth, Database, Realtime, and Storage
- OpenAI API (GPT-4 for text, DALL-E 3 for images) via server-side routes
- Database-driven rate limiting for migration forms and AI images
- RLS policies for role-based access control
- Route groups `(public)` and `(internal)` for separation

---

## Phase 1: Design & Contracts

**Status**: ✅ Complete

### Generated Artifacts

| Artifact | Path | Description |
|----------|-------|-------------|
| Data Model | [data-model.md](./data-model.md) | Entity definitions, relationships, RLS policies |
| API Contracts | [contracts/api.yaml](./contracts/api.yaml) | OpenAPI 3.0 specification |
| Quick Start | [quickstart.md](./quickstart.md) | Setup and development guide |

### Design Highlights

**Entities** (6 core tables):
- `profiles` - User data with roles (member, r4, r5)
- `alliances` - Top 3 alliances with public profiles
- `migration_applications` - Application workflow with status transitions
- `chat_messages` - Real-time chat with image attachments
- `ai_generated_images` - Internal-only images with rate limiting
- `alliance_presentations` - AI-generated text drafts

**RLS Policies**:
- Public: Read alliances, create applications
- Member: Read/edit own profile, read chat, create chat messages
- R4: Read/update applications (own alliance), read presentations
- R5: Edit alliance data, manage member roles, create presentations

**API Endpoints** (8 routes):
- `/public/applications` POST - Submit migration (rate limited)
- `/applications` GET/PATCH - R4/R5 application management
- `/chat/messages` GET - Retrieve chat history
- `/ai/text` POST - Generate presentation (R4/R5 only)
- `/ai/image` POST - Generate image (rate limited)

---

## Phase 2: Implementation Tasks

**Status**: Not Started

Tasks will be generated by `/speckit.tasks` command.

---

## Post-Design Constitution Check

**Status**: ✅ PASS (Re-verified)

All constitution requirements remain satisfied after design phase:

| Principle | Verification | Status |
|-----------|---------------|--------|
| MVP-first | Single app, no unnecessary complexity | ✅ |
| Public/Internal Separation | Route groups + RLS policies defined | ✅ |
| Role Governance | RBAC in data model with enforcement | ✅ |
| AI Server-Side Only | API routes with environment variables | ✅ |
| AI Rate Limiting | `rate_limits` table with constraints | ✅ |
| Single Global Chat | "state-244-diplomacy" room only | ✅ |
| Security Measures | Rate limiting, honeypot, audit fields | ✅ |

No violations or deviations from constitution principles.
