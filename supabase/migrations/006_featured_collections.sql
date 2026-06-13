-- AppHub: Featured apps and collections

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
