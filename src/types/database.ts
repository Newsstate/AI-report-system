export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: 'owner' | 'admin' | 'member' | 'viewer';
          agency_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      clients: {
        Row: {
          id: string;
          created_by: string | null;
          name: string;
          website: string | null;
          location: string | null;
          logo_url: string | null;
          brand_color: string;
          industry: string | null;
          contact_email: string | null;
          contact_name: string | null;
          notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['clients']['Row'],
          'id' | 'created_at' | 'updated_at'
        >;
        Update: Partial<Database['public']['Tables']['clients']['Insert']>;
      };
      report_requests: {
        Row: {
          id: string;
          client_id: string;
          requested_by: string | null;
          report_type: ReportType;
          status: ReportRequestStatus;
          date_range_start: string | null;
          date_range_end: string | null;
          keywords: string[] | null;
          work_done_notes: string | null;
          custom_instructions: string | null;
          excel_file_url: string | null;
          excel_file_name: string | null;
          n8n_execution_id: string | null;
          n8n_workflow_id: string | null;
          n8n_triggered_at: string | null;
          n8n_completed_at: string | null;
          retry_count: number;
          error_message: string | null;
          priority: Priority;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['report_requests']['Row'],
          'id' | 'created_at' | 'updated_at'
        >;
        Update: Partial<Database['public']['Tables']['report_requests']['Insert']>;
      };
      report_data: {
        Row: {
          id: string;
          report_request_id: string;
          data_type: string;
          source: string | null;
          data: Json;
          processed: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['report_data']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['report_data']['Insert']>;
      };
      reports: {
        Row: {
          id: string;
          report_request_id: string | null;
          client_id: string;
          created_by: string | null;
          title: string;
          report_type: string;
          executive_summary: string | null;
          key_insights: Json;
          recommendations: Json;
          metrics_snapshot: Json;
          pdf_url: string | null;
          ppt_url: string | null;
          raw_data_url: string | null;
          status: ReportStatus;
          is_shared: boolean;
          share_token: string | null;
          report_period_start: string | null;
          report_period_end: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['reports']['Row'],
          'id' | 'created_at' | 'updated_at'
        >;
        Update: Partial<Database['public']['Tables']['reports']['Insert']>;
      };
      automation_logs: {
        Row: {
          id: string;
          report_request_id: string | null;
          event_type: AutomationEventType;
          message: string | null;
          payload: Json | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['automation_logs']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['automation_logs']['Insert']>;
      };
      activity_feed: {
        Row: {
          id: string;
          user_id: string | null;
          entity_type: EntityType;
          entity_id: string | null;
          action: string;
          description: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['activity_feed']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['activity_feed']['Insert']>;
      };
      team_members: {
        Row: {
          id: string;
          user_id: string;
          invited_by: string | null;
          email: string;
          role: TeamRole;
          status: TeamMemberStatus;
          invited_at: string;
          joined_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['team_members']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['team_members']['Insert']>;
      };
    };
  };
};

// =============================================================================
// ENUMS
// =============================================================================

export type ReportType =
  | 'monthly_seo'
  | 'technical_audit'
  | 'keyword_analysis'
  | 'competitor_analysis'
  | 'backlink_audit'
  | 'content_gap'
  | 'custom';

export type ReportRequestStatus =
  | 'pending'
  | 'processing'
  | 'ai_analyzing'
  | 'generating'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type ReportStatus = 'draft' | 'published' | 'archived';

export type Priority = 'low' | 'normal' | 'high' | 'urgent';

export type TeamRole = 'admin' | 'member' | 'viewer';

export type TeamMemberStatus = 'pending' | 'active' | 'suspended';

export type AutomationEventType =
  | 'triggered'
  | 'status_check'
  | 'webhook_received'
  | 'completed'
  | 'failed'
  | 'retried'
  | 'cancelled';

export type EntityType = 'client' | 'report' | 'report_request' | 'team';

// =============================================================================
// CONVENIENCE TYPES
// =============================================================================

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Client = Database['public']['Tables']['clients']['Row'];
export type ReportRequest = Database['public']['Tables']['report_requests']['Row'];
export type ReportData = Database['public']['Tables']['report_data']['Row'];
export type Report = Database['public']['Tables']['reports']['Row'];
export type AutomationLog = Database['public']['Tables']['automation_logs']['Row'];
export type ActivityFeedItem = Database['public']['Tables']['activity_feed']['Row'];
export type TeamMember = Database['public']['Tables']['team_members']['Row'];

// Extended types with joins
export type ReportRequestWithClient = ReportRequest & {
  clients: Pick<Client, 'id' | 'name' | 'logo_url' | 'brand_color'>;
};

export type ReportWithClient = Report & {
  clients: Pick<Client, 'id' | 'name' | 'logo_url' | 'brand_color'>;
};

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// =============================================================================
// N8N TYPES
// =============================================================================

export interface N8nWebhookPayload {
  reportRequestId: string;
  clientId: string;
  clientName: string;
  clientWebsite: string;
  reportType: ReportType;
  dateRangeStart: string;
  dateRangeEnd: string;
  keywords: string[];
  workDoneNotes: string;
  customInstructions: string;
  excelFileUrl?: string;
  callbackUrl: string;
  timestamp: string;
}

export interface N8nExecutionStatus {
  id: string;
  status: 'new' | 'running' | 'success' | 'error' | 'waiting';
  startedAt?: string;
  stoppedAt?: string;
  data?: Record<string, unknown>;
}

// =============================================================================
// AI TYPES
// =============================================================================

export interface AIReportSummary {
  executiveSummary: string;
  keyInsights: Array<{
    title: string;
    description: string;
    impact: 'positive' | 'negative' | 'neutral';
    metric?: string;
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    category: string;
  }>;
  metricsSnapshot: {
    organicTraffic?: number;
    trafficChange?: number;
    keywordsRanking?: number;
    avgPosition?: number;
    backlinks?: number;
    domainAuthority?: number;
  };
}

// =============================================================================
// DASHBOARD STATS
// =============================================================================

export interface DashboardStats {
  totalClients: number;
  activeReports: number;
  pendingAutomations: number;
  completedThisMonth: number;
  recentActivity: ActivityFeedItem[];
  reportsByStatus: Record<string, number>;
}
