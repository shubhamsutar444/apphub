-- AppHub: Reviews, downloads, favorites

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

CREATE INDEX idx_reviews_app ON public.reviews(application_id, created_at DESC);
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
CREATE INDEX idx_downloads_user ON public.downloads(user_id, created_at DESC);

CREATE TABLE public.favorites (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  application_id  UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, application_id)
);

CREATE INDEX idx_favorites_user ON public.favorites(user_id, created_at DESC);
