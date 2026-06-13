-- AppHub: Seed default categories

INSERT INTO public.categories (name, slug, icon, description, sort_order) VALUES
  ('Games', 'games', '🎮', 'Action, puzzle, and casual games', 1),
  ('Productivity', 'productivity', '📋', 'Tools to get things done', 2),
  ('Social', 'social', '💬', 'Connect with friends and communities', 3),
  ('Music & Audio', 'music-audio', '🎵', 'Music players and audio tools', 4),
  ('Photography', 'photography', '📷', 'Camera and photo editing apps', 5),
  ('Tools', 'tools', '🔧', 'Utilities and system tools', 6),
  ('Education', 'education', '📚', 'Learning and study apps', 7),
  ('Finance', 'finance', '💰', 'Banking, budgeting, and finance', 8),
  ('Health & Fitness', 'health-fitness', '❤️', 'Wellness and workout apps', 9),
  ('Shopping', 'shopping', '🛍️', 'E-commerce and deals', 10),
  ('Travel', 'travel', '✈️', 'Maps, booking, and travel guides', 11),
  ('News & Magazines', 'news-magazines', '📰', 'News readers and publications', 12)
ON CONFLICT (slug) DO NOTHING;
