-- AppHub: Applications, versions, screenshots

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

CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_applications_slug ON public.applications(slug);
CREATE INDEX idx_applications_developer ON public.applications(developer_id);
CREATE INDEX idx_applications_category ON public.applications(category_id);
CREATE INDEX idx_applications_download_count ON public.applications(download_count DESC);
CREATE INDEX idx_applications_published_at ON public.applications(published_at DESC NULLS LAST);
CREATE INDEX idx_applications_search ON public.applications
  USING GIN (to_tsvector('english', name || ' ' || short_description || ' ' || COALESCE(array_to_string(tags, ' '), '')));

CREATE TRIGGER applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

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

CREATE INDEX idx_application_versions_app ON public.application_versions(application_id);

CREATE TABLE public.application_screenshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  url             TEXT NOT NULL,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_application_screenshots_app ON public.application_screenshots(application_id, sort_order);
