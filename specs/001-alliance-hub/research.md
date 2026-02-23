# Research: State 244 Hub – MVP

**Feature**: [spec.md](./spec.md)
**Date**: 2026-02-20
**Phase**: 0 - Technical Decisions

## Overview

This document consolidates technical decisions and best practices for implementing State 244 Hub MVP. All decisions align with the constitution's principles: MVP-first, public/internal separation, role governance, and AI usage constraints.

---

## Technology Decisions

### 1. Frontend Framework: Next.js 16 with App Router

**Decision**: Next.js 16 with TypeScript and App Router

**Rationale**:
- Constitution requires deployment on Netlify, which has excellent Next.js support
- App Router provides built-in route groups for public/internal separation (`(public)` and `(internal)` route groups)
- Server Actions and API routes keep AI API keys server-side (constitution requirement)
- TypeScript provides type safety for complex role-based permissions
- Strong ecosystem with Supabase integration libraries

**Alternatives considered**:
- **Remix**: Similar capabilities, but smaller ecosystem and less Netlify-specific optimizations
- **SvelteKit**: Lightweight, but less mature auth/realtime integrations
- **Vanilla React + Custom Router**: More flexibility, but reinvents routing, auth, and deployment infrastructure

---

### 2. Authentication & Database: Supabase

**Decision**: Supabase for authentication, PostgreSQL database, realtime, and storage

**Rationale**:
- Constitution explicitly requires Supabase for Auth, Database, Realtime, and Storage
- Single platform reduces integration complexity (aligns with "Ship Fast" principle)
- Row Level Security (RLS) enforces role-based permissions at database level
- Built-in email authentication (matches FR-005)
- Realtime subscriptions for application status updates (FR-010) and chat (FR-006-008)
- Storage buckets with public/private access control for images (FR-014)

**Alternatives considered**:
- **Auth0 + PostgreSQL + Pusher**: More flexible, but requires integrating three separate services
- **Firebase**: Good auth/database, but storage access control is less granular than Supabase RLS
- **Custom PostgreSQL + JWT auth**: Maximum control, but violates "deploy within one day" constraint

---

### 3. Realtime: Supabase Realtime (PostgreSQL Changes + Broadcast)

**Decision**: Supabase Realtime for application status updates and chat messages

**Rationale**:
- Constitution requires Supabase Realtime
- Changes API: Perfect for application status updates (FR-010) - R5 changes status → all R4/R5 see update
- Broadcast API: Ideal for chat messages (FR-007-008) - instant message delivery without database writes
- No additional service needed (part of Supabase platform)

**Implementation pattern**:
```typescript
// For application status (Changes API)
supabase
  .channel('applications')
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'migration_applications' })
  .subscribe((payload) => updateApplicationStatus(payload.new))

// For chat (Broadcast API)
supabase.channel('state-244-diplomacy').send({
  type: 'broadcast',
  event: 'message',
  payload: message
})
```

**Alternatives considered**:
- **Pusher**: Excellent realtime, but adds cost and another integration
- **Socket.io**: Custom server required, violates "deploy within one day" constraint
- **Server-Sent Events (SSE)**: One-way only, chat requires bidirectional

---

### 4. AI Integration: OpenAI API via Next.js API Routes

**Decision**: OpenAI API (GPT-4 for text, DALL-E 3 for images) accessed through Next.js API routes

**Rationale**:
- Constitution requires server-side AI API keys only (FR-023)
- Next.js API routes provide server-side execution with environment variable access
- Industry standard for AI text and image generation
- Rate limiting can be enforced server-side (FR-015)

**Implementation pattern**:
```typescript
// app/api/ai/text/route.ts
export async function POST(request: Request) {
  const { bulletPoints, tone } = await request.json()
  const aiResponse = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [{ role: 'system', content: `Tone: ${tone}` }, ...]
  })
  return NextResponse.json({ text: aiResponse.choices[0].message.content })
}
```

**Alternatives considered**:
- **Anthropic Claude**: Good alternative, but similar API structure
- **Client-side AI API calls**: Violates constitution (API keys must be server-side)
- **Stable Diffusion (self-hosted)**: Too complex for MVP, violates "deploy within one day"

---

### 5. Rate Limiting Strategy

**Decision**: Server-side rate limiting using Supabase database + IP-based tracking

**Rationale**:
- Constitution requires rate limiting for migration forms (FR-021) and AI image generation (FR-015)
- Database-driven approach works on serverless platforms (no in-memory state)
- Track rate limit by user_id (for authenticated) and IP (for public forms)

**Implementation**:
```sql
-- Table for rate limiting
CREATE TABLE rate_limits (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  ip_address TEXT,
  resource_type TEXT NOT NULL, -- 'application_submit', 'ai_image_generate'
  request_count INT DEFAULT 1,
  window_start TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_resource UNIQUE (user_id, ip_address, resource_type, window_start)
);

-- 5 images per user per day
SELECT COUNT(*) < 5 FROM rate_limits
WHERE user_id = auth.uid()
  AND resource_type = 'ai_image_generate'
  AND window_start > NOW() - INTERVAL '1 day';

-- Migration form rate limit (10 per IP per hour)
SELECT COUNT(*) < 10 FROM rate_limits
WHERE ip_address = client_ip
  AND resource_type = 'application_submit'
  AND window_start > NOW() - INTERVAL '1 hour';
```

**Alternatives considered**:
- **Redis-based rate limiting**: More performant, but requires additional infrastructure
- **Netlify Functions rate limiting**: Platform-specific, less portable
- **Cloudflare Workers**: Good for edge, but adds complexity

---

### 6. Honeypot Anti-Spam

**Decision**: CSS-hidden form field + server-side validation

**Rationale**:
- Constitution requires honeypot fields for migration forms (FR-022)
- Simple, effective against automated bots
- No impact on UX (hidden field with `display: none`)

**Implementation**:
```html
<!-- Hidden via CSS, not name or type="hidden" -->
<style>
  .website-hp { display: none !important; }
</style>
<input name="website" class="website-hp" tabindex="-1" autocomplete="off" />

<!-- Server validation -->
if (formData.website) {
  // Bot detected - reject
}
```

**Alternatives considered**:
- **reCAPTCHA**: Better bot detection, but requires Google account and adds UX friction
- **Custom honeypot library**: Overkill for MVP

---

### 7. Public vs Internal Separation Strategy

**Decision**: Route groups + Middleware + RLS policies

**Rationale**:
- Constitution mandates strict public/internal separation
- Multi-layered approach provides defense in depth

**Implementation**:

1. **Route Groups** (UI level):
   - `(public)` - Landing, alliance profiles, application form
   - `(internal)` - Dashboard, chat, AI tools (requires auth)

2. **Middleware** (Request level):
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('sb-access-token')
  if (request.nextUrl.pathname.startsWith('/internal') && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}
```

3. **RLS Policies** (Database level):
```sql
-- Public can view alliances
CREATE POLICY "alliances_public_read" ON alliances
  FOR SELECT USING (true);

-- Internal only for AI images
CREATE POLICY "ai_images_auth_only" ON ai_images
  FOR SELECT USING (auth.role() IS NOT NULL);
```

---

### 8. Role-Based Access Control (RBAC)

**Decision**: User role in `profiles` table with Supabase RLS policies

**Rationale**:
- Constitution defines 5 roles: Public, Applicant, Member, R4, R5
- Must enforce in application logic, not UI only
- RLS policies provide database-level enforcement

**Implementation**:
```sql
CREATE TYPE user_role AS ENUM ('member', 'r4', 'r5');

CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  role user_role DEFAULT 'member',
  alliance_id REFERENCES alliances(id),
  -- ...
);

-- R5 can edit alliance data
CREATE POLICY "alliance_r5_edit" ON alliances
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'r5'
    )
  );
```

---

### 9. Deployment: Netlify with Auto-Deploy

**Decision**: Netlify with GitHub integration for auto-deploy

**Rationale**:
- Constitution requires Netlify deployment
- Native Next.js support with edge functions
- Environment variables configured in Netlify UI (not hardcoded)
- Auto-deploy on git push (fast iteration)

**Environment variables (Netlify UI)**:
```
NEXT_PUBLIC_SUPABASE_URL=<public_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<public_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
OPENAI_API_KEY=<openai_api_key>
```

**Alternatives considered**:
- **Vercel**: Good Next.js support, but constitution requires Netlify
- **AWS Amplify**: Overkill for MVP, violates "Ship Fast"

---

## Testing Strategy

### Unit Tests (Jest + React Testing Library)
- Component logic, hooks, utilities
- Mock Supabase and AI API calls

### Integration Tests
- API route behavior (auth, rate limiting, AI calls)
- Database operations with test fixtures

### E2E Tests (Playwright)
- User journeys: public discovery, application submission, auth, chat
- Role-based access scenarios

---

## Security Considerations

### API Key Protection
- AI API keys stored in Netlify environment variables only
- Never exposed to client (server-side API routes only)

### Storage Access Control
- Public bucket: alliance logos, public images
- Private bucket: AI-generated images, chat attachments
- Supabase RLS policies enforce bucket access

### CSRF Protection
- Next.js built-in CSRF tokens for form submissions
- SameSite cookies for auth

### SQL Injection Prevention
- Supabase client parameterizes queries
- Raw SQL usage limited to migrations only

---

## Performance Considerations

### Database Indexing
- Indexes on `migration_applications.status`, `alliances.rank`
- Composite indexes for common queries (alliance_id + status)

### Realtime Optimization
- Subscribe only to relevant changes (per alliance for applications)
- Debounce chat message updates (50ms)

### Image Optimization
- Next.js Image component for alliance logos
- Lazy loading for alliance profile images

---

## Compliance Summary

| Requirement | Implementation | Status |
|--------------|----------------|--------|
| MVP-first, deploy within 1 day | Single platform (Next.js + Supabase) | ✅ |
| Public/Internal separation | Route groups + RLS | ✅ |
| Role governance | Database RBAC with RLS | ✅ |
| AI server-side only | API routes with env vars | ✅ |
| AI rate limiting | Database-driven counters | ✅ |
| Single global chat | "State 244 Diplomacy" room only | ✅ |
| Rate limiting (migration) | IP-based with database | ✅ |
| Honeypot anti-spam | Hidden CSS field | ✅ |
| Netlify deployment | Auto-deploy from GitHub | ✅ |

All constitution requirements are satisfied with documented technical decisions.
