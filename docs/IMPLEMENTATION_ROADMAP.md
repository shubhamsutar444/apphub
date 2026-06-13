# AppHub — Implementation Roadmap

> Production-ready Android App Marketplace  
> Stack: Next.js 15 · Supabase · Vercel · Razorpay  
> Status: **Phase 1 Complete** — Database, auth, and RBAC ready

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Database Schema](#3-database-schema)
4. [Folder Structure](#4-folder-structure)
5. [Implementation Phases](#5-implementation-phases)
6. [Security Architecture](#6-security-architecture)
7. [Deployment Architecture](#7-deployment-architecture)
8. [Risk Register & Decisions](#8-risk-register--decisions)

---

## 1. Executive Summary

AppHub is a three-sided marketplace:

| Actor | Primary Goals |
|-------|---------------|
| **User** | Discover, download, review, favorite apps |
| **Developer** | Submit apps, pay for publishing plans, track analytics |
| **Admin** | Moderate submissions, manage platform, view revenue |

### Core Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend hosting | Vercel | Native Next.js 15 support, edge middleware, ISR |
| Backend / DB / Auth / Storage | Supabase | Single vendor for Postgres, RLS, realtime, storage |
| Payments | Razorpay (server-side) | INR plans (₹99/₹299/₹999), webhook verification |
| File delivery | Supabase Storage + signed URLs | Secure APK downloads, no public bucket exposure |
| Search | Postgres full-text + trigram | Fast enough for MVP; upgrade to Meilisearch later if needed |
| Realtime | Supabase Realtime on `notifications` | Push-style in-app notifications |
| Rate limiting | Upstash Redis + `@upstash/ratelimit` | Works on Vercel serverless |

### Non-Goals (Phase 1)

- Native Android client (web-first, PWA)
- In-app purchase revenue share for paid apps
- Multi-language i18n (English only initially)
- Automated APK malware scanning (manual admin review + file validation)

---

## 2. System Architecture

### 2.1 High-Level Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                     │
│   Browser (Desktop/Mobile)  ·  PWA  ·  Service Worker (offline shell)   │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │ HTTPS
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         VERCEL (Edge + Serverless)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │  Middleware  │  │  App Router  │  │  API Routes  │  │  Cron Jobs  │ │
│  │  (Auth/RBAC) │  │  RSC + CSR   │  │  /api/*      │  │  (optional) │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘ │
└───────────────┬─────────────────────────────┬───────────────────────────┘
                │                             │
                ▼                             ▼
┌───────────────────────────┐   ┌─────────────────────────────────────────┐
│      SUPABASE             │   │              RAZORPAY                      │
│  ┌─────────────────────┐  │   │  Orders · Payments · Webhooks            │
│  │ PostgreSQL + RLS    │  │   └─────────────────────────────────────────┘
│  │ Auth (JWT)          │  │
│  │ Storage (APK/media) │  │   ┌─────────────────────────────────────────┐
│  │ Realtime            │  │   │         UPSTASH REDIS (optional)         │
│  │ Edge Functions*     │  │   │         Rate limiting                    │
│  └─────────────────────┘  │   └─────────────────────────────────────────┘
└───────────────────────────┘

* Edge Functions optional for heavy APK validation; prefer Next.js API routes first.
```

### 2.2 Request Flow — App Download

```
User clicks "Download APK"
    → GET /api/apps/[slug]/download
    → Middleware: session optional (track anonymous downloads)
    → Server: verify app status = approved
    → Server: increment download counter (transaction)
    → Server: insert downloads row
    → Server: generate Supabase signed URL (60s TTL)
    → Redirect / stream URL to client
```

### 2.3 Request Flow — App Submission + Payment

```
Developer submits form + uploads files
    → POST /api/developer/apps (creates draft application)
    → Files uploaded to Supabase Storage (private buckets)
    → POST /api/payments/create-order (Razorpay order)
    → Client: Razorpay Checkout
    → Webhook POST /api/webhooks/razorpay (verify signature)
    → Update payment + set application status = pending_review
    → Notify admins via notifications table + realtime
    → Admin approves → status = approved, published_at set
    → Notify developer
```

### 2.4 Authentication & RBAC Model

Supabase Auth manages identity. App roles live in `public.users` (extended profile).

```
auth.users (Supabase)
    └── 1:1 ── public.users (role: user | developer | admin)
                    └── 1:1 ── public.developers (if role >= developer)
```

**Role escalation:**

- Signup → `user`
- "Become a Developer" flow → creates `developers` row, sets `role = developer`
- Admin assigned manually in DB or via seed script (never self-service)

**Middleware protection matrix:**

| Route prefix | user | developer | admin |
|--------------|------|-----------|-------|
| `/` (public) | ✓ | ✓ | ✓ |
| `/marketplace`, `/apps/[slug]` | ✓ | ✓ | ✓ |
| `/dashboard/user/*` | ✓ | ✓ | ✓ |
| `/dashboard/developer/*` | ✗ | ✓ | ✓ |
| `/dashboard/admin/*` | ✗ | ✗ | ✓ |
| `/api/admin/*` | ✗ | ✗ | ✓ |

### 2.5 Data Access Pattern

| Layer | Responsibility |
|-------|----------------|
| **RLS (Supabase)** | Last line of defense; row-level permissions |
| **Server Actions / API Routes** | Business logic, validation (Zod), rate limits |
| **React Server Components** | Read-heavy pages, SEO, initial data |
| **Client Components** | Interactivity, forms, charts, infinite scroll |

Use `@supabase/ssr` with cookie-based sessions for Next.js 15 App Router.

### 2.6 Caching Strategy

| Content | Strategy |
|---------|----------|
| Landing stats | ISR revalidate 60s |
| Marketplace listing | ISR 30s + client infinite scroll |
| App detail (approved) | ISR 60s, on-demand revalidate on approval |
| Dashboards | Dynamic, no cache |
| Static assets | Vercel CDN |

---

## 3. Database Schema

### 3.1 ER Overview

```
users ─────┬──── developers ───── applications ───── application_versions
           │                           │
           │                           ├── categories (M:N via app_categories)
           │                           ├── reviews
           │                           ├── downloads
           │                           ├── favorites
           │                           └── featured_apps
           │
           ├── notifications
           ├── payments
           └── activity_logs

applications ─── payments (submission fee)
```

### 3.2 Enums

```sql
CREATE TYPE user_role AS ENUM ('user', 'developer', 'admin');
CREATE TYPE app_status AS ENUM ('draft', 'pending_review', 'approved', 'rejected', 'changes_requested', 'archived');
CREATE TYPE publishing_plan AS ENUM ('basic', 'priority', 'featured');
CREATE TYPE payment_status AS ENUM ('created', 'pending', 'paid', 'failed', 'refunded');
CREATE TYPE notification_type AS ENUM (
  'app_approved', 'app_rejected', 'app_updated', 'changes_requested',
  'favorite_updated', 'new_version', 'new_submission', 'new_payment'
);
```

### 3.3 Core Tables

#### `users`

Extends Supabase `auth.users`.

```sql
CREATE TABLE public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT,
  avatar_url    TEXT,
  role          user_role NOT NULL DEFAULT 'user',
  is_verified   BOOLEAN NOT NULL DEFAULT FALSE,
  theme         TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark', 'light')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `developers`

```sql
CREATE TABLE public.developers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  display_name    TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  bio             TEXT,
  website         TEXT,
  support_email   TEXT,
  is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  total_downloads BIGINT NOT NULL DEFAULT 0,
  total_apps      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `categories`

```sql
CREATE TABLE public.categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  icon        TEXT,
  description TEXT,
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `applications`

```sql
CREATE TABLE public.applications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id        UUID NOT NULL REFERENCES public.developers(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  slug                TEXT NOT NULL UNIQUE,
  short_description   TEXT NOT NULL,
  full_description    TEXT NOT NULL,
  status              app_status NOT NULL DEFAULT 'draft',
  category_id         UUID REFERENCES public.categories(id),
  icon_url            TEXT,
  banner_url          TEXT,
  developer_website   TEXT,
  support_email       TEXT,
  privacy_policy_url  TEXT,
  tags                TEXT[] DEFAULT '{}',
  current_version     TEXT,
  apk_size_bytes      BIGINT,
  rating_avg          NUMERIC(3,2) NOT NULL DEFAULT 0,
  rating_count        INT NOT NULL DEFAULT 0,
  download_count      BIGINT NOT NULL DEFAULT 0,
  is_featured         BOOLEAN NOT NULL DEFAULT FALSE,
  is_editors_choice   BOOLEAN NOT NULL DEFAULT FALSE,
  is_trending         BOOLEAN NOT NULL DEFAULT FALSE,
  publishing_plan     publishing_plan,
  rejection_reason    TEXT,
  admin_notes         TEXT,
  published_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_rating CHECK (rating_avg >= 0 AND rating_avg <= 5)
);

CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_applications_slug ON public.applications(slug);
CREATE INDEX idx_applications_search ON public.applications
  USING GIN (to_tsvector('english', name || ' ' || short_description || ' ' || COALESCE(array_to_string(tags, ' '), '')));
CREATE INDEX idx_applications_download_count ON public.applications(download_count DESC);
CREATE INDEX idx_applications_published_at ON public.applications(published_at DESC NULLS LAST);
```

#### `application_versions`

```sql
CREATE TABLE public.application_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  version         TEXT NOT NULL,
  changelog       TEXT,
  apk_path        TEXT NOT NULL,
  apk_size_bytes  BIGINT NOT NULL,
  min_android_sdk TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (application_id, version)
);
```

#### `application_screenshots`

```sql
CREATE TABLE public.application_screenshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  url             TEXT NOT NULL,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `downloads`

```sql
CREATE TABLE public.downloads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES public.users(id) ON DELETE SET NULL,
  version_id      UUID REFERENCES public.application_versions(id),
  ip_hash         TEXT,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_downloads_app_date ON public.downloads(application_id, created_at DESC);
```

#### `reviews`

```sql
CREATE TABLE public.reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating          INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title           TEXT,
  body            TEXT,
  is_verified_download BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (application_id, user_id)
);
```

#### `favorites`

```sql
CREATE TABLE public.favorites (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  application_id  UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, application_id)
);
```

#### `featured_apps`

```sql
CREATE TABLE public.featured_apps (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  placement       TEXT NOT NULL DEFAULT 'homepage',
  starts_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at         TIMESTAMPTZ,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `app_collections`

```sql
CREATE TABLE public.app_collections (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.app_collection_items (
  collection_id   UUID NOT NULL REFERENCES public.app_collections(id) ON DELETE CASCADE,
  application_id  UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  sort_order      INT NOT NULL DEFAULT 0,
  PRIMARY KEY (collection_id, application_id)
);
```

#### `payments`

```sql
CREATE TABLE public.payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.users(id),
  application_id      UUID REFERENCES public.applications(id),
  plan                publishing_plan NOT NULL,
  amount_paise        INT NOT NULL,
  currency            TEXT NOT NULL DEFAULT 'INR',
  razorpay_order_id   TEXT UNIQUE,
  razorpay_payment_id TEXT UNIQUE,
  razorpay_signature  TEXT,
  status              payment_status NOT NULL DEFAULT 'created',
  metadata            JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `notifications`

```sql
CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type        notification_type NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT,
  link        TEXT,
  metadata    JSONB DEFAULT '{}',
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC);
```

#### `activity_logs`

```sql
CREATE TABLE public.activity_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID REFERENCES public.users(id),
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   UUID,
  metadata    JSONB DEFAULT '{}',
  ip_hash     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_created ON public.activity_logs(created_at DESC);
```

### 3.4 Database Functions & Triggers

```sql
-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update application rating on review insert/update/delete
CREATE OR REPLACE FUNCTION public.sync_app_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.applications SET
    rating_avg = COALESCE((SELECT AVG(rating)::NUMERIC(3,2) FROM public.reviews WHERE application_id = COALESCE(NEW.application_id, OLD.application_id)), 0),
    rating_count = (SELECT COUNT(*) FROM public.reviews WHERE application_id = COALESCE(NEW.application_id, OLD.application_id)),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.application_id, OLD.application_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Increment download_count denormalized field
CREATE OR REPLACE FUNCTION public.increment_download_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.applications SET download_count = download_count + 1 WHERE id = NEW.application_id;
  UPDATE public.developers SET total_downloads = total_downloads + 1
    WHERE id = (SELECT developer_id FROM public.applications WHERE id = NEW.application_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 3.5 Row Level Security (RLS) Summary

| Table | Policy gist |
|-------|-------------|
| `users` | Users read/update own row; admin read all |
| `developers` | Public read; owner write; admin full |
| `applications` | Public read if `status = approved`; developer CRUD own; admin full |
| `application_versions` | Same as applications |
| `reviews` | Public read; authenticated users insert own; owner update/delete |
| `favorites` | Owner only |
| `downloads` | Insert via service role API; user reads own |
| `payments` | Owner read; admin read all; writes via service role |
| `notifications` | Owner read/update (mark read) |
| `activity_logs` | Admin only |

Storage buckets:

| Bucket | Access |
|--------|--------|
| `app-icons` | Public read; developer upload own |
| `app-screenshots` | Public read; developer upload own |
| `app-banners` | Public read; developer upload own |
| `app-apks` | **Private** — signed URLs only via API |

### 3.6 Seed Data

- 12 default categories (Games, Productivity, Social, etc.)
- 1 admin user (env-driven email)
- Optional demo apps (disabled in production)

---

## 4. Folder Structure

```
apphub/
├── .env.local.example
├── .env.production.example
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── tsconfig.json
├── middleware.ts
├── vercel.json
├── public/
│   ├── manifest.json              # PWA
│   ├── sw.js                        # Service worker (generated)
│   ├── robots.txt
│   ├── icons/                       # PWA icons
│   └── og/                          # Default OG images
│
├── docs/
│   ├── IMPLEMENTATION_ROADMAP.md
│   ├── API.md
│   └── DEPLOYMENT.md
│
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   ├── 001_enums_and_users.sql
│   │   ├── 002_developers_and_categories.sql
│   │   ├── 003_applications.sql
│   │   ├── 004_reviews_downloads_favorites.sql
│   │   ├── 005_payments_notifications.sql
│   │   ├── 006_featured_collections.sql
│   │   ├── 007_rls_policies.sql
│   │   ├── 008_triggers_functions.sql
│   │   └── 009_seed_categories.sql
│   └── seed.sql
│
├── src/
│   ├── app/
│   │   ├── layout.tsx               # Root layout, theme, fonts
│   │   ├── page.tsx                 # Landing page
│   │   ├── loading.tsx
│   │   ├── not-found.tsx
│   │   ├── error.tsx
│   │   ├── globals.css
│   │   │
│   │   ├── (marketing)/             # Public marketing group
│   │   │   ├── layout.tsx
│   │   │   ├── about/page.tsx
│   │   │   └── faq/page.tsx
│   │   │
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   │   ├── verify-email/page.tsx
│   │   │   └── callback/route.ts    # Supabase OAuth callback
│   │   │
│   │   ├── marketplace/
│   │   │   ├── page.tsx             # Browse + filters + infinite scroll
│   │   │   └── loading.tsx
│   │   │
│   │   ├── apps/
│   │   │   └── [slug]/
│   │   │       ├── page.tsx         # App detail
│   │   │       └── opengraph-image.tsx
│   │   │
│   │   ├── developers/
│   │   │   └── [slug]/page.tsx      # Developer profile
│   │   │
│   │   ├── collections/
│   │   │   └── [slug]/page.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── layout.tsx           # Role-aware shell
│   │   │   ├── user/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── profile/page.tsx
│   │   │   │   ├── favorites/page.tsx
│   │   │   │   ├── downloads/page.tsx
│   │   │   │   └── reviews/page.tsx
│   │   │   ├── developer/
│   │   │   │   ├── page.tsx         # Overview + analytics
│   │   │   │   ├── apps/page.tsx
│   │   │   │   ├── apps/new/page.tsx
│   │   │   │   ├── apps/[id]/edit/page.tsx
│   │   │   │   └── analytics/page.tsx
│   │   │   └── admin/
│   │   │       ├── page.tsx         # Metrics dashboard
│   │   │       ├── apps/page.tsx
│   │   │       ├── apps/[id]/page.tsx
│   │   │       ├── users/page.tsx
│   │   │       ├── developers/page.tsx
│   │   │       ├── categories/page.tsx
│   │   │       ├── payments/page.tsx
│   │   │       └── analytics/page.tsx
│   │   │
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── callback/route.ts
│   │   │   ├── apps/
│   │   │   │   ├── route.ts                    # GET list (search)
│   │   │   │   ├── search/route.ts             # Live suggestions
│   │   │   │   └── [slug]/
│   │   │   │       ├── route.ts
│   │   │   │       ├── download/route.ts
│   │   │   │       └── report/route.ts
│   │   │   ├── developer/
│   │   │   │   ├── register/route.ts
│   │   │   │   └── apps/
│   │   │   │       ├── route.ts
│   │   │   │       └── [id]/route.ts
│   │   │   ├── admin/
│   │   │   │   ├── apps/[id]/approve/route.ts
│   │   │   │   ├── apps/[id]/reject/route.ts
│   │   │   │   ├── apps/[id]/feature/route.ts
│   │   │   │   ├── users/[id]/route.ts
│   │   │   │   └── categories/route.ts
│   │   │   ├── payments/
│   │   │   │   ├── create-order/route.ts
│   │   │   │   └── verify/route.ts
│   │   │   ├── webhooks/
│   │   │   │   └── razorpay/route.ts
│   │   │   ├── notifications/
│   │   │   │   └── route.ts
│   │   │   ├── reviews/route.ts
│   │   │   ├── favorites/route.ts
│   │   │   ├── stats/route.ts                  # Landing page counters
│   │   │   └── upload/
│   │   │       ├── icon/route.ts
│   │   │       ├── screenshot/route.ts
│   │   │       └── apk/route.ts
│   │   │
│   │   ├── sitemap.ts
│   │   └── robots.ts
│   │
│   ├── components/
│   │   ├── ui/                      # shadcn-style primitives
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── tabs.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── header.tsx
│   │   │   ├── footer.tsx
│   │   │   ├── mobile-nav.tsx
│   │   │   ├── bottom-nav.tsx       # Mobile Android-like nav
│   │   │   ├── sidebar.tsx
│   │   │   └── dashboard-shell.tsx
│   │   ├── marketing/
│   │   │   ├── hero.tsx
│   │   │   ├── stats-section.tsx
│   │   │   ├── featured-apps.tsx
│   │   │   ├── trending-apps.tsx
│   │   │   ├── top-developers.tsx
│   │   │   ├── categories-grid.tsx
│   │   │   ├── testimonials.tsx
│   │   │   └── faq.tsx
│   │   ├── marketplace/
│   │   │   ├── search-bar.tsx
│   │   │   ├── search-suggestions.tsx
│   │   │   ├── filter-panel.tsx
│   │   │   ├── app-card.tsx
│   │   │   ├── app-grid.tsx
│   │   │   └── infinite-app-list.tsx
│   │   ├── apps/
│   │   │   ├── app-header.tsx
│   │   │   ├── screenshot-carousel.tsx
│   │   │   ├── review-list.tsx
│   │   │   ├── review-form.tsx
│   │   │   └── rating-breakdown.tsx
│   │   ├── dashboard/
│   │   │   ├── stat-card.tsx
│   │   │   ├── animated-counter.tsx
│   │   │   ├── charts/
│   │   │   │   ├── revenue-chart.tsx
│   │   │   │   ├── downloads-chart.tsx
│   │   │   │   └── submissions-chart.tsx
│   │   │   └── notification-bell.tsx
│   │   ├── forms/
│   │   │   ├── app-submission-form.tsx
│   │   │   ├── login-form.tsx
│   │   │   ├── signup-form.tsx
│   │   │   └── profile-form.tsx
│   │   ├── payments/
│   │   │   └── razorpay-checkout.tsx
│   │   └── shared/
│   │       ├── theme-provider.tsx
│   │       ├── theme-toggle.tsx
│   │       ├── page-transition.tsx
│   │       ├── verified-badge.tsx
│   │       └── empty-state.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   ├── middleware.ts
│   │   │   └── admin.ts             # Service role (server only)
│   │   ├── razorpay/
│   │   │   ├── client.ts
│   │   │   └── plans.ts
│   │   ├── validations/
│   │   │   ├── auth.ts
│   │   │   ├── app.ts
│   │   │   ├── review.ts
│   │   │   └── payment.ts
│   │   ├── utils/
│   │   │   ├── cn.ts
│   │   │   ├── format.ts
│   │   │   ├── slugify.ts
│   │   │   └── sanitize.ts
│   │   ├── constants/
│   │   │   ├── routes.ts
│   │   │   ├── plans.ts
│   │   │   └── categories.ts
│   │   ├── hooks/
│   │   │   ├── use-user.ts
│   │   │   ├── use-notifications.ts
│   │   │   ├── use-infinite-apps.ts
│   │   │   └── use-debounce.ts
│   │   ├── actions/
│   │   │   ├── auth.ts
│   │   │   ├── apps.ts
│   │   │   ├── reviews.ts
│   │   │   └── admin.ts
│   │   ├── notifications/
│   │   │   └── create.ts
│   │   ├── rate-limit.ts
│   │   └── seo.ts
│   │
│   └── types/
│       ├── database.types.ts        # Generated from Supabase
│       ├── app.ts
│       └── index.ts
│
└── tests/                           # Phase 6
    ├── unit/
    └── e2e/
```

---

## 5. Implementation Phases

### Phase 0 — Foundation (Days 1–2)

**Goal:** Runnable skeleton deployable to Vercel.

| Task | Deliverable |
|------|-------------|
| Init Next.js 15 + TypeScript + Tailwind | `package.json`, configs |
| Design tokens in Tailwind | Colors, glassmorphism utilities |
| Supabase project + env vars | `.env.local.example` |
| Base layouts (Header, Footer, Mobile nav) | Responsive shell |
| Theme provider (dark/light) | Persist in `users.theme` |
| CI: lint + typecheck | GitHub Actions optional |

**Exit criteria:** App deploys to Vercel preview; dark gradient landing stub visible.

---

### Phase 1 — Database & Auth (Days 3–5)

**Goal:** Secure identity and data layer.

| Task | Deliverable |
|------|-------------|
| Run all Supabase migrations | Tables, enums, triggers |
| Generate `database.types.ts` | Type-safe queries |
| Supabase SSR auth setup | Cookie sessions |
| Middleware RBAC | Route protection |
| Auth pages (login, signup, forgot, verify) | React Hook Form + Zod |
| Profile sync trigger | Auto `users` row |
| Admin bootstrap script | First admin user |

**Exit criteria:** User can sign up, verify email, log in; middleware blocks `/dashboard/admin` for non-admins.

---

### Phase 2 — Landing & Marketplace (Days 6–10)

**Goal:** Public discovery experience.

| Task | Deliverable |
|------|-------------|
| Landing page (all sections) | Hero, stats, featured, FAQ |
| Animated counters API | `/api/stats` |
| Marketplace page | Filters, sort, grid |
| App card component | Hover animations |
| Infinite scroll | Cursor pagination |
| Live search suggestions | Debounced `/api/apps/search` |
| App detail page | Screenshots, reviews shell |
| SEO metadata + OG images | Per route |
| `sitemap.ts` + `robots.ts` | Crawlable |

**Exit criteria:** Approved apps browsable and searchable; landing feels premium with Framer Motion.

---

### Phase 3 — Developer Flow (Days 11–15)

**Goal:** End-to-end app submission.

| Task | Deliverable |
|------|-------------|
| Developer registration | `/api/developer/register` |
| App submission form | Multi-step with uploads |
| Secure upload API | APK/icon/screenshot validation |
| Publishing plan selection | UI for 3 tiers |
| Razorpay order creation | `/api/payments/create-order` |
| Razorpay webhook | Payment → pending_review |
| Developer dashboard | Apps list, status badges |
| Edit/delete own apps | Pre-approval only |
| Developer analytics (basic) | Downloads chart |

**Exit criteria:** Developer pays ₹99+, app enters `pending_review`; files stored privately.

---

### Phase 4 — Admin & Moderation (Days 16–19)

**Goal:** Platform control plane.

| Task | Deliverable |
|------|-------------|
| Admin dashboard metrics | Recharts dashboards |
| Approve / reject / request changes | Status transitions + notifications |
| Feature / editor's choice toggles | `featured_apps` table |
| User & developer management | Role changes, verify badge |
| Category CRUD | Admin categories page |
| Payments ledger | View all payments |
| Activity logs | Audit trail |
| Admin instant publish | Bypass payment for admin-owned apps |

**Exit criteria:** Admin approves app → visible on marketplace; rejection notifies developer.

---

### Phase 5 — User Features & Notifications (Days 20–23)

**Goal:** Engagement loop.

| Task | Deliverable |
|------|-------------|
| APK download flow | Signed URLs + download tracking |
| Reviews CRUD | Rating sync trigger |
| Favorites | User dashboard |
| Download history | User dashboard |
| Realtime notifications | Supabase channel + bell UI |
| Report app | Anti-spam rate limit |
| Leaderboard / top developers | Public pages |
| App collections | Curated lists |

**Exit criteria:** Full user journey: favorite → download → review → notification on update.

---

### Phase 6 — PWA, Polish & Production (Days 24–28)

**Goal:** Production hardening.

| Task | Deliverable |
|------|-------------|
| PWA manifest + service worker | Installable app |
| Push notifications (web push) | Optional VAPID setup |
| Rate limiting all public APIs | Upstash Redis |
| Input sanitization (XSS) | DOMPurify for UGC |
| CSRF tokens for mutations | Double-submit cookie |
| Loading skeletons everywhere | UX polish |
| Error boundaries + logging | Sentry optional |
| Performance audit | Lighthouse > 90 |
| E2E tests (critical paths) | Playwright |
| Production env + Vercel deploy | Custom domain |
| `DEPLOYMENT.md` | Runbook |

**Exit criteria:** Production deployment live; security checklist passed.

---

### Phase Timeline (Gantt-style)

```
Week 1:  [Phase 0][──── Phase 1 ────][── Phase 2 ──]
Week 2:  [── Phase 2 cont. ──][──── Phase 3 ────]
Week 3:  [── Phase 4 ──][──── Phase 5 ────]
Week 4:  [──── Phase 6 ────][ Launch ]
```

---

## 6. Security Architecture

### 6.1 Checklist

| Control | Implementation |
|---------|----------------|
| RBAC | Middleware + RLS + API role checks (defense in depth) |
| Input validation | Zod on every API route and server action |
| File uploads | MIME check, max size (APK 150MB), extension whitelist, virus scan hook (future) |
| APK downloads | Private bucket, short-lived signed URLs, download API only |
| Rate limiting | 10 req/min search, 5 req/min auth, 3 reviews/day |
| XSS | Sanitize review HTML; React auto-escape; CSP headers |
| CSRF | SameSite cookies + CSRF token on POST/PATCH/DELETE |
| Webhook security | Razorpay HMAC signature verification |
| Secrets | Vercel env vars only; service role never exposed client-side |
| SQL injection | Parameterized Supabase queries only |
| Admin actions | Logged to `activity_logs` |

### 6.2 Content Security Policy (vercel.json headers)

```
default-src 'self';
script-src 'self' 'unsafe-inline' https://checkout.razorpay.com;
connect-src 'self' https://*.supabase.co wss://*.supabase.co;
img-src 'self' data: https://*.supabase.co;
```

---

## 7. Deployment Architecture

### 7.1 Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App
NEXT_PUBLIC_APP_URL=https://apphub.vercel.app

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=

# Rate limiting (optional)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Admin bootstrap
ADMIN_EMAIL=
```

### 7.2 Vercel Configuration

- **Framework:** Next.js
- **Regions:** `bom1` (Mumbai) primary for India latency
- **Cron (optional):** Nightly trending score recalculation
- **Preview deployments:** Separate Supabase branch or staging project

### 7.3 Supabase Setup Steps

1. Create project (ap-south-1)
2. Run migrations in order (`001` → `009`)
3. Create storage buckets with policies
4. Enable Realtime on `notifications`
5. Configure Auth: email verification required, site URL = Vercel domain
6. Add redirect URLs for auth callback

### 7.4 Razorpay Setup

1. Create Razorpay account + KYC
2. Configure webhook URL: `https://[domain]/api/webhooks/razorpay`
3. Events: `payment.captured`, `payment.failed`
4. Test mode keys for preview deployments

---

## 8. Risk Register & Decisions

| Risk | Mitigation |
|------|------------|
| APK malware | Admin review mandatory; file type validation; future VirusTotal API |
| Storage costs (large APKs) | 150MB limit; lifecycle policy for draft APKs |
| Razorpay webhook misses | Idempotent payment updates; reconciliation cron |
| Search scale | Postgres FTS sufficient to ~100K apps; Meilisearch migration path documented |
| Vercel serverless timeout on upload | Direct client → Supabase Storage upload with signed upload URLs |
| Role escalation | Admin role DB-only; never exposed in client env |

### Open Questions (resolve before Phase 3)

1. **Anonymous downloads** — Allow without login? (Recommended: yes, track via IP hash)
2. **App updates** — New version re-triggers review? (Recommended: yes for APK change)
3. **Refund policy** — Manual via Razorpay dashboard initially

---

## Next Step

**Phase 0 implementation** — scaffold Next.js project, Supabase migrations, design system, and deploy empty shell to Vercel.

---

*Document version: 1.0 · Created: 2025-06-12*
