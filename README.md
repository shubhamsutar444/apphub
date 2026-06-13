# AppHub

Production-ready Android App Marketplace built with Next.js 15, Supabase, and Vercel.

## Tech Stack

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS, Framer Motion
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Payments:** Razorpay (Phase 3)
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- Supabase project (Phase 1)

### Installation

```bash
npm install
cp .env.local.example .env.local
# Fill in Supabase credentials
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript check |

## Project Structure

```
src/
├── app/           # Next.js App Router pages
├── components/    # UI, layout, marketing components
└── lib/           # Supabase, utils, constants
docs/              # Implementation roadmap
supabase/          # Migrations (Phase 1)
```

## Deployment (Vercel)

1. Push to GitHub
2. Import project in Vercel
3. Set environment variables from `.env.production.example`
4. Deploy

Region: `bom1` (Mumbai) configured in `vercel.json`.

## Implementation Phases

See [docs/IMPLEMENTATION_ROADMAP.md](docs/IMPLEMENTATION_ROADMAP.md) for the full plan.

| Phase | Status |
|-------|--------|
| 0 — Foundation | ✅ Complete |
| 1 — Database & Auth | ✅ Complete |
| 2 — Landing & Marketplace | Pending |
| 3 — Developer Flow | Pending |
| 4 — Admin & Moderation | Pending |
| 5 — User Features | Pending |
| 6 — Production | Pending |

## License

Private — All rights reserved.
