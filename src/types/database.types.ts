export type UserRole = "user" | "developer" | "admin";

export type AppStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "changes_requested"
  | "archived";

export type PublishingPlan = "basic" | "priority" | "featured";

export type PaymentStatus = "created" | "pending" | "paid" | "failed" | "refunded";

export type NotificationType =
  | "app_approved"
  | "app_rejected"
  | "app_updated"
  | "changes_requested"
  | "favorite_updated"
  | "new_version"
  | "new_submission"
  | "new_payment";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_verified: boolean;
  theme: "dark" | "light";
  created_at: string;
  updated_at: string;
}

export interface DeveloperProfile {
  id: string;
  user_id: string;
  display_name: string;
  slug: string;
  bio: string | null;
  website: string | null;
  support_email: string | null;
  is_verified: boolean;
  total_downloads: number;
  total_apps: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Application {
  id: string;
  developer_id: string;
  name: string;
  slug: string;
  short_description: string;
  full_description: string;
  status: AppStatus;
  category_id: string | null;
  icon_url: string | null;
  banner_url: string | null;
  developer_website: string | null;
  support_email: string | null;
  privacy_policy_url: string | null;
  tags: string[];
  current_version: string | null;
  apk_size_bytes: number | null;
  rating_avg: number;
  rating_count: number;
  download_count: number;
  is_featured: boolean;
  is_editors_choice: boolean;
  is_trending: boolean;
  publishing_plan: PublishingPlan | null;
  rejection_reason: string | null;
  admin_notes: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  categories?: Category;
  developers?: DeveloperProfile;
}

export interface ApplicationVersion {
  id: string;
  application_id: string;
  version: string;
  changelog: string | null;
  apk_path: string;
  apk_size_bytes: number;
  min_android_sdk: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ApplicationScreenshot {
  id: string;
  application_id: string;
  url: string;
  sort_order: number;
  created_at: string;
}

export interface Review {
  id: string;
  application_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  body: string | null;
  is_verified_download: boolean;
  created_at: string;
  updated_at: string;
  users?: UserProfile;
}

export interface Download {
  id: string;
  application_id: string;
  user_id: string | null;
  version_id: string | null;
  ip_hash: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  application_id: string;
  created_at: string;
  applications?: Application;
}

export interface Payment {
  id: string;
  user_id: string;
  application_id: string | null;
  plan: PublishingPlan;
  amount_paise: number;
  currency: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  status: PaymentStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  users?: UserProfile;
  applications?: Application;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  metadata: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  profile: UserProfile;
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: UserProfile;
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          is_verified?: boolean;
          theme?: "dark" | "light";
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          is_verified?: boolean;
          theme?: "dark" | "light";
        };
        Relationships: [];
      };
      developers: {
        Row: DeveloperProfile;
        Insert: {
          user_id: string;
          display_name: string;
          slug: string;
          bio?: string | null;
          website?: string | null;
          support_email?: string | null;
        };
        Update: Partial<{
          display_name: string;
          slug: string;
          bio: string | null;
          website: string | null;
          support_email: string | null;
          is_verified: boolean;
        }>;
        Relationships: [];
      };
      categories: {
        Row: Category;
        Insert: {
          name: string;
          slug: string;
          icon?: string | null;
          description?: string | null;
          sort_order?: number;
          is_active?: boolean;
        };
        Update: Partial<{
          name: string;
          slug: string;
          icon: string | null;
          description: string | null;
          sort_order: number;
          is_active: boolean;
        }>;
        Relationships: [];
      };
      applications: {
        Row: Application;
        Insert: Partial<Application> & { developer_id: string; name: string; slug: string; short_description: string; full_description: string };
        Update: Partial<Application>;
        Relationships: [];
      };
      reviews: {
        Row: Review;
        Insert: { application_id: string; user_id: string; rating: number; title?: string | null; body?: string | null };
        Update: Partial<Review>;
        Relationships: [];
      };
      downloads: {
        Row: Download;
        Insert: { application_id: string; user_id?: string | null; version_id?: string | null; ip_hash?: string | null };
        Update: Partial<Download>;
        Relationships: [];
      };
      favorites: {
        Row: Favorite;
        Insert: { user_id: string; application_id: string };
        Update: Partial<Favorite>;
        Relationships: [];
      };
      payments: {
        Row: Payment;
        Insert: Partial<Payment> & { user_id: string; plan: PublishingPlan; amount_paise: number };
        Update: Partial<Payment>;
        Relationships: [];
      };
      notifications: {
        Row: Notification;
        Insert: {
          user_id: string;
          type: NotificationType;
          title: string;
          body?: string | null;
          link?: string | null;
          metadata?: Record<string, unknown>;
          is_read?: boolean;
        };
        Update: Partial<{
          title: string;
          body: string | null;
          link: string | null;
          is_read: boolean;
        }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      app_status: AppStatus;
      publishing_plan: PublishingPlan;
      payment_status: PaymentStatus;
      notification_type: NotificationType;
    };
    CompositeTypes: Record<string, never>;
  };
}
