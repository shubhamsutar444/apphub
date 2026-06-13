-- ============================================================
-- AppHub Complete Database Schema
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- ── 001: Enums and users ─────────────────────────────────────

CREATE TYPE public.user_role AS ENUM ('user', 'developer', 'admin');
CREATE TYPE public.app_status AS ENUM (
  'draft', 'pending_review', 'approved', 'rejected', 'changes_requested', 'archived'
);
CREATE TYPE public.publishing_plan AS ENUM ('basic', 'priority', 'featured');
CREATE TYPE public.payment_status AS ENUM ('created', 'pending', 'paid', 'failed', 'refunded');
CREATE TYPE public.notification_type AS ENUM (
  'app_approved', 'app_rejected', 'app_updated', 'changes_requested',
  'favorite_updated', 'new_version', 'new_submission', 'new_payment'
);

CREATE TABLE public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT,
  avatar_url    TEXT,
  role          public.user_role NOT NULL DEFAULT 'user',
  is_verified   BOOLEAN NOT NULL DEFAULT FALSE,
  theme         TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark', 'light')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_role  ON public.users(role);
CREATE INDEX idx_users_email ON public.users(email);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, is_verified)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.email_confirmed_at IS NOT NULL, FALSE)
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_user_email_confirmed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE public.users SET is_verified = TRUE, updated_at = NOW() WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_email_confirmed();

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.is_developer_or_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('developer','admin'));
$$;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- ── 002: Developers and categories ───────────────────────────

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

CREATE INDEX idx_developers_slug    ON public.developers(slug);
CREATE INDEX idx_developers_user_id ON public.developers(user_id);

CREATE TRIGGER developers_updated_at
  BEFORE UPDATE ON public.developers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

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

CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_categories_sort ON public.categories(sort_order);

-- ── 003: Applications ─────────────────────────────────────────

CREATE TABLE public.applications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id        UUID NOT NULL REFERENCES public.developers(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  slug                TEXT NOT NULL UNIQUE,
  short_description   TEXT NOT NULL,
  full_description    TEXT NOT NULL,
  status              public.app_status NOT NULL DEFAULT 'draft',
  category_id         UUID REFERENCES public.categories(id) ON DELETE SET NULL,
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
  publishing_plan     public.publishing_plan,
  rejection_reason    TEXT,
  admin_notes         TEXT,
  published_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_rating CHECK (rating_avg >= 0 AND rating_avg <= 5)
);

CREATE INDEX idx_applications_status        ON public.applications(status);
CREATE INDEX idx_applications_slug          ON public.applications(slug);
CREATE INDEX idx_applications_developer     ON public.applications(developer_id);
CREATE INDEX idx_applications_category      ON public.applications(category_id);
CREATE INDEX idx_applications_download_count ON public.applications(download_count DESC);
CREATE INDEX idx_applications_published_at  ON public.applications(published_at DESC NULLS LAST);

CREATE TRIGGER applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.application_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  version         TEXT NOT NULL,
  changelog       TEXT,
  apk_path        TEXT NOT NULL,
  apk_size_bytes  BIGINT NOT NULL DEFAULT 0,
  min_android_sdk TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (application_id, version)
);

CREATE INDEX idx_application_versions_app ON public.application_versions(application_id);

CREATE TABLE public.application_screenshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  url             TEXT NOT NULL,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_application_screenshots_app ON public.application_screenshots(application_id, sort_order);

-- ── 004: Reviews, downloads, favorites ───────────────────────

CREATE TABLE public.reviews (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id       UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  user_id              UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating               INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title                TEXT,
  body                 TEXT,
  is_verified_download BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (application_id, user_id)
);

CREATE INDEX idx_reviews_app  ON public.reviews(application_id, created_at DESC);
CREATE INDEX idx_reviews_user ON public.reviews(user_id);

CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.downloads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES public.users(id) ON DELETE SET NULL,
  version_id      UUID REFERENCES public.application_versions(id) ON DELETE SET NULL,
  ip_hash         TEXT,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_downloads_app_date ON public.downloads(application_id, created_at DESC);
CREATE INDEX idx_downloads_user     ON public.downloads(user_id, created_at DESC);

CREATE TABLE public.favorites (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  application_id  UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, application_id)
);

CREATE INDEX idx_favorites_user ON public.favorites(user_id, created_at DESC);

-- ── 005: Payments and notifications ──────────────────────────

CREATE TABLE public.payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  application_id      UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  plan                public.publishing_plan NOT NULL,
  amount_paise        INT NOT NULL,
  currency            TEXT NOT NULL DEFAULT 'INR',
  razorpay_order_id   TEXT UNIQUE,
  razorpay_payment_id TEXT UNIQUE,
  razorpay_signature  TEXT,
  status              public.payment_status NOT NULL DEFAULT 'created',
  metadata            JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_user   ON public.payments(user_id, created_at DESC);
CREATE INDEX idx_payments_status ON public.payments(status);

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type        public.notification_type NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT,
  link        TEXT,
  metadata    JSONB DEFAULT '{}',
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

CREATE TABLE public.activity_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   UUID,
  metadata    JSONB DEFAULT '{}',
  ip_hash     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_created ON public.activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_actor   ON public.activity_logs(actor_id, created_at DESC);

-- ── 006: Featured collections ─────────────────────────────────

CREATE TABLE public.featured_apps (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  placement       TEXT NOT NULL DEFAULT 'homepage',
  starts_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at         TIMESTAMPTZ,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_featured_apps_placement ON public.featured_apps(placement, sort_order);

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

-- ── 007: Row Level Security ───────────────────────────────────

ALTER TABLE public.users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_versions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_screenshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downloads              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_apps          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_collections        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_collection_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs          ENABLE ROW LEVEL SECURITY;

-- Users
CREATE POLICY "users_select" ON public.users FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "users_update" ON public.users FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "users_admin"  ON public.users FOR ALL    TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Developers
CREATE POLICY "devs_select" ON public.developers FOR SELECT USING (TRUE);
CREATE POLICY "devs_insert" ON public.developers FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "devs_update" ON public.developers FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_admin()) WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "devs_delete" ON public.developers FOR DELETE TO authenticated USING (public.is_admin());

-- Categories
CREATE POLICY "cats_select" ON public.categories FOR SELECT USING (is_active = TRUE OR public.is_admin());
CREATE POLICY "cats_write"  ON public.categories FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Applications
CREATE POLICY "apps_select" ON public.applications FOR SELECT USING (
  status = 'approved' OR public.is_admin()
  OR developer_id IN (SELECT id FROM public.developers WHERE user_id = auth.uid())
);
CREATE POLICY "apps_insert" ON public.applications FOR INSERT TO authenticated WITH CHECK (
  public.is_developer_or_admin()
  AND developer_id IN (SELECT id FROM public.developers WHERE user_id = auth.uid())
);
CREATE POLICY "apps_update" ON public.applications FOR UPDATE TO authenticated
  USING (public.is_admin() OR developer_id IN (SELECT id FROM public.developers WHERE user_id = auth.uid()))
  WITH CHECK (public.is_admin() OR developer_id IN (SELECT id FROM public.developers WHERE user_id = auth.uid()));
CREATE POLICY "apps_delete" ON public.applications FOR DELETE TO authenticated
  USING (public.is_admin() OR (developer_id IN (SELECT id FROM public.developers WHERE user_id = auth.uid()) AND status IN ('draft','rejected','changes_requested')));

-- Versions
CREATE POLICY "versions_select" ON public.application_versions FOR SELECT USING (
  application_id IN (SELECT id FROM public.applications WHERE status='approved' OR public.is_admin() OR developer_id IN (SELECT id FROM public.developers WHERE user_id=auth.uid()))
);
CREATE POLICY "versions_write" ON public.application_versions FOR ALL TO authenticated
  USING (public.is_admin() OR application_id IN (SELECT a.id FROM public.applications a JOIN public.developers d ON d.id=a.developer_id WHERE d.user_id=auth.uid()))
  WITH CHECK (public.is_admin() OR application_id IN (SELECT a.id FROM public.applications a JOIN public.developers d ON d.id=a.developer_id WHERE d.user_id=auth.uid()));

-- Screenshots
CREATE POLICY "screenshots_select" ON public.application_screenshots FOR SELECT USING (
  application_id IN (SELECT id FROM public.applications WHERE status='approved' OR public.is_admin() OR developer_id IN (SELECT id FROM public.developers WHERE user_id=auth.uid()))
);
CREATE POLICY "screenshots_write" ON public.application_screenshots FOR ALL TO authenticated
  USING (public.is_admin() OR application_id IN (SELECT a.id FROM public.applications a JOIN public.developers d ON d.id=a.developer_id WHERE d.user_id=auth.uid()))
  WITH CHECK (public.is_admin() OR application_id IN (SELECT a.id FROM public.applications a JOIN public.developers d ON d.id=a.developer_id WHERE d.user_id=auth.uid()));

-- Reviews
CREATE POLICY "reviews_select" ON public.reviews FOR SELECT USING (TRUE);
CREATE POLICY "reviews_insert" ON public.reviews FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "reviews_update" ON public.reviews FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "reviews_delete" ON public.reviews FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_admin());

-- Downloads
CREATE POLICY "downloads_select" ON public.downloads FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "downloads_insert" ON public.downloads FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Favorites
CREATE POLICY "favs_select" ON public.favorites FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "favs_insert" ON public.favorites FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "favs_delete" ON public.favorites FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Featured / Collections
CREATE POLICY "featured_select" ON public.featured_apps FOR SELECT USING (TRUE);
CREATE POLICY "featured_write"  ON public.featured_apps FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "colls_select"    ON public.app_collections FOR SELECT USING (is_active = TRUE OR public.is_admin());
CREATE POLICY "colls_write"     ON public.app_collections FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "coll_items_sel"  ON public.app_collection_items FOR SELECT USING (TRUE);
CREATE POLICY "coll_items_write" ON public.app_collection_items FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Payments
CREATE POLICY "payments_select" ON public.payments FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "payments_insert" ON public.payments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Notifications
CREATE POLICY "notifs_select" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifs_update" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "notifs_insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (TRUE);

-- Activity logs
CREATE POLICY "logs_admin" ON public.activity_logs FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── 008: Triggers & functions ─────────────────────────────────

CREATE OR REPLACE FUNCTION public.sync_app_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE target_app_id UUID;
BEGIN
  target_app_id := COALESCE(NEW.application_id, OLD.application_id);
  UPDATE public.applications SET
    rating_avg   = COALESCE((SELECT AVG(rating)::NUMERIC(3,2) FROM public.reviews WHERE application_id = target_app_id), 0),
    rating_count = (SELECT COUNT(*) FROM public.reviews WHERE application_id = target_app_id),
    updated_at   = NOW()
  WHERE id = target_app_id;
  RETURN COALESCE(NEW, OLD);
END; $$;

CREATE TRIGGER reviews_sync_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.sync_app_rating();

CREATE OR REPLACE FUNCTION public.increment_download_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.applications SET download_count = download_count + 1, updated_at = NOW() WHERE id = NEW.application_id;
  UPDATE public.developers SET total_downloads = total_downloads + 1, updated_at = NOW()
    WHERE id = (SELECT developer_id FROM public.applications WHERE id = NEW.application_id);
  RETURN NEW;
END; $$;

CREATE TRIGGER downloads_increment_count
  AFTER INSERT ON public.downloads
  FOR EACH ROW EXECUTE FUNCTION public.increment_download_count();

CREATE OR REPLACE FUNCTION public.sync_developer_app_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE target_dev_id UUID;
BEGIN
  target_dev_id := COALESCE(NEW.developer_id, OLD.developer_id);
  UPDATE public.developers SET
    total_apps = (SELECT COUNT(*) FROM public.applications WHERE developer_id = target_dev_id AND status != 'archived'),
    updated_at = NOW()
  WHERE id = target_dev_id;
  RETURN COALESCE(NEW, OLD);
END; $$;

CREATE TRIGGER applications_sync_dev_count
  AFTER INSERT OR UPDATE OR DELETE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.sync_developer_app_count();

CREATE OR REPLACE FUNCTION public.promote_user_to_developer()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.users SET role = 'developer', updated_at = NOW()
  WHERE id = NEW.user_id AND role = 'user';
  RETURN NEW;
END; $$;

CREATE TRIGGER developers_promote_user
  AFTER INSERT ON public.developers
  FOR EACH ROW EXECUTE FUNCTION public.promote_user_to_developer();

-- ── 009: Seed categories ──────────────────────────────────────

INSERT INTO public.categories (name, slug, icon, description, sort_order) VALUES
  ('Games',            'games',          '🎮', 'Action, puzzle, and casual games',       1),
  ('Productivity',     'productivity',   '📋', 'Tools to get things done',               2),
  ('Social',           'social',         '💬', 'Connect with friends and communities',   3),
  ('Music & Audio',    'music-audio',    '🎵', 'Music players and audio tools',          4),
  ('Photography',      'photography',    '📷', 'Camera and photo editing apps',          5),
  ('Tools',            'tools',          '🔧', 'Utilities and system tools',             6),
  ('Education',        'education',      '📚', 'Learning and study apps',               7),
  ('Finance',          'finance',        '💰', 'Banking, budgeting, and finance',        8),
  ('Health & Fitness', 'health-fitness', '❤️', 'Wellness and workout apps',             9),
  ('Shopping',         'shopping',       '🛍️', 'E-commerce and deals',                 10),
  ('Travel',           'travel',         '✈️', 'Maps, booking, and travel guides',      11),
  ('News & Magazines', 'news-magazines', '📰', 'News readers and publications',         12)
ON CONFLICT (slug) DO NOTHING;
