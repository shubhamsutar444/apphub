# Supabase Setup for AppHub

## 1. Create Project

1. Go to [supabase.com](https://supabase.com) and create a project (region: **ap-south-1**)
2. Copy **Project URL** and **anon key** from Settings → API
3. Copy **service_role key** (server-only, never expose to client)

## 2. Configure Environment

```bash
cp .env.local.example .env.local
```

Fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAIL=your-admin@email.com
```

## 3. Run Migrations

### Option A: Supabase CLI

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

### Option B: SQL Editor

Run each file in `supabase/migrations/` in order (`001` → `009`) in the Supabase SQL Editor.

## 4. Configure Auth

In Supabase Dashboard → Authentication → URL Configuration:

| Setting | Value |
|---------|-------|
| Site URL | `http://localhost:3000` (or your Vercel URL) |
| Redirect URLs | `http://localhost:3000/auth/callback` |

Enable **Email confirmations** under Authentication → Providers → Email.

## 5. Bootstrap Admin

1. Sign up with your admin email via `/signup`
2. Verify email
3. Run:

```bash
npm run bootstrap-admin -- your-admin@email.com
```

## 6. Verify

- Sign in at `/login`
- Visit `/dashboard/admin` — should work for admin only
- Non-admin users are redirected away from admin routes
