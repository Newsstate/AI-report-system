-- =============================================================================
-- AI SEO AUTOMATION PLATFORM - Database Schema
-- Run this in your Supabase SQL Editor
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- USERS & TEAM MANAGEMENT
-- =============================================================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  agency_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Team members
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  invited_by UUID REFERENCES public.profiles(id),
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  invited_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================================================
-- CLIENT MANAGEMENT
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  website TEXT,
  location TEXT,
  logo_url TEXT,
  brand_color TEXT DEFAULT '#6272f6',
  industry TEXT,
  contact_email TEXT,
  contact_name TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================================================
-- REPORT REQUESTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.report_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  requested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL CHECK (report_type IN (
    'monthly_seo', 'technical_audit', 'keyword_analysis', 
    'competitor_analysis', 'backlink_audit', 'content_gap', 'custom'
  )),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'ai_analyzing', 'generating', 'completed', 'failed', 'cancelled'
  )),
  date_range_start DATE,
  date_range_end DATE,
  keywords TEXT[], -- Array of target keywords
  work_done_notes TEXT,
  custom_instructions TEXT,
  excel_file_url TEXT,
  excel_file_name TEXT,
  -- n8n automation tracking
  n8n_execution_id TEXT,
  n8n_workflow_id TEXT,
  n8n_triggered_at TIMESTAMPTZ,
  n8n_completed_at TIMESTAMPTZ,
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  -- Metadata
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================================================
-- SEO DATA (Raw data from n8n automation)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.report_data (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  report_request_id UUID REFERENCES public.report_requests(id) ON DELETE CASCADE NOT NULL,
  data_type TEXT NOT NULL CHECK (data_type IN (
    'organic_traffic', 'keyword_rankings', 'backlinks', 'technical_issues',
    'page_speed', 'competitor_data', 'content_metrics', 'raw_excel', 'custom'
  )),
  source TEXT, -- 'google_analytics', 'search_console', 'ahrefs', 'semrush', 'manual'
  data JSONB NOT NULL DEFAULT '{}',
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================================================
-- GENERATED REPORTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  report_request_id UUID REFERENCES public.report_requests(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  report_type TEXT NOT NULL,
  -- AI Generated content
  executive_summary TEXT,
  key_insights JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  metrics_snapshot JSONB DEFAULT '{}',
  -- Files
  pdf_url TEXT,
  ppt_url TEXT,
  raw_data_url TEXT,
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_shared BOOLEAN DEFAULT FALSE,
  share_token TEXT UNIQUE,
  -- Dates
  report_period_start DATE,
  report_period_end DATE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================================================
-- AUTOMATION LOGS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.automation_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  report_request_id UUID REFERENCES public.report_requests(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'triggered', 'status_check', 'webhook_received', 'completed', 
    'failed', 'retried', 'cancelled'
  )),
  message TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================================================
-- ACTIVITY FEED
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.activity_feed (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('client', 'report', 'report_request', 'team')),
  entity_id UUID,
  action TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_clients_created_by ON public.clients(created_by);
CREATE INDEX IF NOT EXISTS idx_clients_is_active ON public.clients(is_active);
CREATE INDEX IF NOT EXISTS idx_report_requests_client_id ON public.report_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_report_requests_status ON public.report_requests(status);
CREATE INDEX IF NOT EXISTS idx_report_requests_created_by ON public.report_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_reports_client_id ON public.reports(client_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_report_data_request_id ON public.report_data(report_request_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_request_id ON public.automation_logs(report_request_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_user_id ON public.activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created_at ON public.activity_feed(created_at DESC);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow profile creation on signup
CREATE POLICY "Enable insert for authenticated users" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Clients: Authenticated users can manage clients
CREATE POLICY "Authenticated users can view clients" ON public.clients
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert clients" ON public.clients
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their clients" ON public.clients
  FOR UPDATE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their clients" ON public.clients
  FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Report Requests: Authenticated users access
CREATE POLICY "Authenticated users can view report requests" ON public.report_requests
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert report requests" ON public.report_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Users can update their report requests" ON public.report_requests
  FOR UPDATE TO authenticated USING (true);

-- Reports: Authenticated users access
CREATE POLICY "Authenticated users can view reports" ON public.reports
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert reports" ON public.reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update reports" ON public.reports
  FOR UPDATE TO authenticated USING (true);

-- Report Data
CREATE POLICY "Authenticated users can view report data" ON public.report_data
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert report data" ON public.report_data
  FOR INSERT TO authenticated WITH CHECK (true);

-- Automation Logs
CREATE POLICY "Authenticated users can view automation logs" ON public.automation_logs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert automation logs" ON public.automation_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- Activity Feed
CREATE POLICY "Authenticated users can view activity" ON public.activity_feed
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert activity" ON public.activity_feed
  FOR INSERT TO authenticated WITH CHECK (true);

-- Team Members
CREATE POLICY "Authenticated users can view team" ON public.team_members
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage team" ON public.team_members
  FOR ALL TO authenticated USING (true);

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_requests_updated_at
  BEFORE UPDATE ON public.report_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- STORAGE BUCKETS (Run separately or via Supabase Dashboard)
-- =============================================================================

-- INSERT INTO storage.buckets (id, name, public) VALUES ('client-logos', 'client-logos', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('report-uploads', 'report-uploads', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('generated-reports', 'generated-reports', false);

-- Storage policies for client-logos (public read)
-- CREATE POLICY "Public can view logos" ON storage.objects FOR SELECT USING (bucket_id = 'client-logos');
-- CREATE POLICY "Authenticated can upload logos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'client-logos');
-- CREATE POLICY "Users can delete own logos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'client-logos');

-- Storage policies for report-uploads (authenticated only)
-- CREATE POLICY "Authenticated can upload files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'report-uploads');
-- CREATE POLICY "Authenticated can view uploaded files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'report-uploads');

-- =============================================================================
-- SEED DATA (Optional - for development)
-- =============================================================================

-- INSERT INTO public.clients (name, website, location, brand_color, industry) VALUES
--   ('Acme Corporation', 'https://acme.com', 'New York, USA', '#6272f6', 'Technology'),
--   ('Global Retail Co', 'https://globalretail.com', 'London, UK', '#10b981', 'Retail'),
--   ('HealthFirst Clinic', 'https://healthfirst.com', 'Toronto, Canada', '#f59e0b', 'Healthcare');
