-- AppHub: Row Level Security policies

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_screenshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- USERS
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "users_admin_all" ON public.users
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- DEVELOPERS
CREATE POLICY "developers_select_public" ON public.developers
  FOR SELECT USING (TRUE);

CREATE POLICY "developers_insert_own" ON public.developers
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "developers_update_own" ON public.developers
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "developers_delete_admin" ON public.developers
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- CATEGORIES
CREATE POLICY "categories_select_public" ON public.categories
  FOR SELECT USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "categories_admin_write" ON public.categories
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- APPLICATIONS
CREATE POLICY "applications_select_approved" ON public.applications
  FOR SELECT USING (
    status = 'approved'
    OR public.is_admin()
    OR developer_id IN (SELECT id FROM public.developers WHERE user_id = auth.uid())
  );

CREATE POLICY "applications_insert_developer" ON public.applications
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_developer_or_admin()
    AND developer_id IN (SELECT id FROM public.developers WHERE user_id = auth.uid())
  );

CREATE POLICY "applications_update_owner_or_admin" ON public.applications
  FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR developer_id IN (SELECT id FROM public.developers WHERE user_id = auth.uid())
  )
  WITH CHECK (
    public.is_admin()
    OR developer_id IN (SELECT id FROM public.developers WHERE user_id = auth.uid())
  );

CREATE POLICY "applications_delete_owner_or_admin" ON public.applications
  FOR DELETE TO authenticated
  USING (
    public.is_admin()
    OR (
      developer_id IN (SELECT id FROM public.developers WHERE user_id = auth.uid())
      AND status IN ('draft', 'rejected', 'changes_requested')
    )
  );

-- APPLICATION VERSIONS
CREATE POLICY "app_versions_select" ON public.application_versions
  FOR SELECT USING (
    application_id IN (
      SELECT id FROM public.applications
      WHERE status = 'approved'
      OR public.is_admin()
      OR developer_id IN (SELECT id FROM public.developers WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "app_versions_write_owner" ON public.application_versions
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR application_id IN (
      SELECT a.id FROM public.applications a
      JOIN public.developers d ON d.id = a.developer_id
      WHERE d.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin()
    OR application_id IN (
      SELECT a.id FROM public.applications a
      JOIN public.developers d ON d.id = a.developer_id
      WHERE d.user_id = auth.uid()
    )
  );

-- APPLICATION SCREENSHOTS
CREATE POLICY "app_screenshots_select" ON public.application_screenshots
  FOR SELECT USING (
    application_id IN (
      SELECT id FROM public.applications
      WHERE status = 'approved'
      OR public.is_admin()
      OR developer_id IN (SELECT id FROM public.developers WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "app_screenshots_write_owner" ON public.application_screenshots
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR application_id IN (
      SELECT a.id FROM public.applications a
      JOIN public.developers d ON d.id = a.developer_id
      WHERE d.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin()
    OR application_id IN (
      SELECT a.id FROM public.applications a
      JOIN public.developers d ON d.id = a.developer_id
      WHERE d.user_id = auth.uid()
    )
  );

-- REVIEWS
CREATE POLICY "reviews_select_public" ON public.reviews
  FOR SELECT USING (TRUE);

CREATE POLICY "reviews_insert_own" ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "reviews_update_own" ON public.reviews
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "reviews_delete_own_or_admin" ON public.reviews
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- DOWNLOADS
CREATE POLICY "downloads_select_own_or_admin" ON public.downloads
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "downloads_insert_authenticated" ON public.downloads
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- FAVORITES
CREATE POLICY "favorites_select_own" ON public.favorites
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "favorites_insert_own" ON public.favorites
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "favorites_delete_own" ON public.favorites
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- FEATURED APPS
CREATE POLICY "featured_apps_select_public" ON public.featured_apps
  FOR SELECT USING (TRUE);

CREATE POLICY "featured_apps_admin_write" ON public.featured_apps
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- COLLECTIONS
CREATE POLICY "collections_select_active" ON public.app_collections
  FOR SELECT USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "collections_admin_write" ON public.app_collections
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "collection_items_select" ON public.app_collection_items
  FOR SELECT USING (TRUE);

CREATE POLICY "collection_items_admin_write" ON public.app_collection_items
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- PAYMENTS
CREATE POLICY "payments_select_own_or_admin" ON public.payments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- NOTIFICATIONS
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ACTIVITY LOGS
CREATE POLICY "activity_logs_admin_only" ON public.activity_logs
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
