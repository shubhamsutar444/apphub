-- AppHub: Developers and categories

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

CREATE INDEX idx_developers_slug ON public.developers(slug);
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
