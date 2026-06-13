-- AppHub: Business logic triggers

-- Sync application rating on review changes
CREATE OR REPLACE FUNCTION public.sync_app_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_app_id UUID;
BEGIN
  target_app_id := COALESCE(NEW.application_id, OLD.application_id);

  UPDATE public.applications SET
    rating_avg = COALESCE((
      SELECT AVG(rating)::NUMERIC(3,2) FROM public.reviews WHERE application_id = target_app_id
    ), 0),
    rating_count = (SELECT COUNT(*) FROM public.reviews WHERE application_id = target_app_id),
    updated_at = NOW()
  WHERE id = target_app_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER reviews_sync_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.sync_app_rating();

-- Increment download counters
CREATE OR REPLACE FUNCTION public.increment_download_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.applications
  SET download_count = download_count + 1, updated_at = NOW()
  WHERE id = NEW.application_id;

  UPDATE public.developers
  SET total_downloads = total_downloads + 1, updated_at = NOW()
  WHERE id = (SELECT developer_id FROM public.applications WHERE id = NEW.application_id);

  RETURN NEW;
END;
$$;

CREATE TRIGGER downloads_increment_count
  AFTER INSERT ON public.downloads
  FOR EACH ROW EXECUTE FUNCTION public.increment_download_count();

-- Keep developer total_apps in sync
CREATE OR REPLACE FUNCTION public.sync_developer_app_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_dev_id UUID;
BEGIN
  target_dev_id := COALESCE(NEW.developer_id, OLD.developer_id);

  UPDATE public.developers SET
    total_apps = (
      SELECT COUNT(*) FROM public.applications
      WHERE developer_id = target_dev_id AND status != 'archived'
    ),
    updated_at = NOW()
  WHERE id = target_dev_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER applications_sync_dev_count
  AFTER INSERT OR UPDATE OR DELETE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.sync_developer_app_count();

-- Promote user to developer when developer profile is created
CREATE OR REPLACE FUNCTION public.promote_user_to_developer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET role = 'developer', updated_at = NOW()
  WHERE id = NEW.user_id AND role = 'user';
  RETURN NEW;
END;
$$;

CREATE TRIGGER developers_promote_user
  AFTER INSERT ON public.developers
  FOR EACH ROW EXECUTE FUNCTION public.promote_user_to_developer();
