# State 244 Hub

A comprehensive alliance management platform for State of Survival's State 244.

## Features

- **User Authentication** - Secure login with Supabase Auth
- **Profile Management** - Update display name, HQ level, and power
- **Alliance Management** - Manage alliance info, members, and settings (R4/R5)
- **Migration Applications** - Review and approve player migration requests
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
3. Set publish directory: `.next`
4. Add environment variables
5. Deploy

### Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## License

MIT
