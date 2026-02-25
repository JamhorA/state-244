# State 244 Hub

A comprehensive alliance management platform for State of Survival's State 244.

## Features

- **User Authentication** - Secure login with Supabase Auth
- **Profile Management** - Update display name, HQ level, and power
- **Alliance Management** - Manage alliance info, members, and settings (R4/R5)
- **Migration Applications** - Review and approve player migration requests (with application topic)
- **Migration Application Notifications** - Discord webhook alerts for new applications
- **Public Contact Form** - Collect support and alliance inquiries from visitors
- **Admin Contact Inbox** - Superadmin message review, status tracking, and reply workflow
- **Contact Notifications** - Discord webhook alerts for new contact messages
- **State Info Proposals** - Vote on state-level decisions (R5/Superadmin)
- **Admin Panel** - Full user and system management (Superadmin)
- **Approved Players Showcase** - Celebrate new members with animated marquee
- **Excel Export** - Export application data for analysis

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage
- **Realtime:** Supabase Realtime

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/JamhorA/state-244.git
cd state-244
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
OPENAI_API_KEY=your-openai-api-key
CONTACT_DISCORD_WEBHOOK_URL=your-contact-discord-webhook
APPLICATIONS_DISCORD_WEBHOOK_URL=your-applications-discord-webhook
```

4. Run development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## User Roles

| Role | Description |
|------|-------------|
| Member | Basic access - view profile and alliance info |
| R4 (Officer) | Review applications, manage alliance |
| R5 (Leader) | Full alliance control + vote on proposals |
| President | Final approval on all migration applications |
| Superadmin | Full system access |

## Deployment

### Netlify (Recommended)

1. Connect GitHub repo to Netlify
2. Set build command: `npm run build`
3. Do **not** set a publish directory for Next.js (leave it empty)
4. Do **not** manually configure `@netlify/plugin-nextjs` in `netlify.toml`
5. Add environment variables
6. Trigger deploy from Git/Netlify UI (recommended for SSR/hybrid routes)

### Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `NEXT_PUBLIC_APP_URL` | App base URL (use production domain on Netlify) |
| `OPENAI_API_KEY` | OpenAI API key for AI text/image features (server-side only) |
| `CONTACT_DISCORD_WEBHOOK_URL` | Discord webhook for contact form notifications |
| `APPLICATIONS_DISCORD_WEBHOOK_URL` | Discord webhook for migration application notifications |

### Netlify Notes (Next.js 16)

- Netlify auto-detects Next.js and provisions the correct runtime; avoid pinning `@netlify/plugin-nextjs` manually.
- Keep `netlify.toml` minimal and version-controlled (build command + Node version).
- If the site shows a generic Netlify 404 after a local CLI deploy, trigger a Git-based deploy from Netlify instead.

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## License

MIT
