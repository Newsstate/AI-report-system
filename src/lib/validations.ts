import { z } from 'zod';

// =============================================================================
// CLIENT SCHEMA
// =============================================================================

export const clientSchema = z.object({
  name: z.string().min(2, 'Client name must be at least 2 characters').max(100),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  location: z.string().max(100).optional(),
  brand_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Please enter a valid hex color')
    .default('#6272f6'),
  industry: z.string().max(50).optional(),
  contact_email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  contact_name: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
  is_active: z.boolean().default(true),
});

export type ClientFormData = z.infer<typeof clientSchema>;

// =============================================================================
// REPORT REQUEST SCHEMA
// =============================================================================

export const reportRequestSchema = z.object({
  client_id: z.string().uuid('Please select a valid client'),
  report_type: z.enum(
    [
      'monthly_seo',
      'technical_audit',
      'keyword_analysis',
      'competitor_analysis',
      'backlink_audit',
      'content_gap',
      'custom',
    ],
    { required_error: 'Please select a report type' }
  ),
  date_range_start: z.string().min(1, 'Start date is required'),
  date_range_end: z.string().min(1, 'End date is required'),
  keywords: z
    .string()
    .optional()
    .transform((val) =>
      val
        ? val
            .split('\n')
            .map((k) => k.trim())
            .filter(Boolean)
        : []
    ),
  work_done_notes: z.string().max(5000).optional(),
  custom_instructions: z.string().max(2000).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
});

export type ReportRequestFormData = z.infer<typeof reportRequestSchema>;

// =============================================================================
// AUTH SCHEMAS
// =============================================================================

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const signupSchema = z
  .object({
    full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string(),
    agency_name: z.string().min(2, 'Agency name must be at least 2 characters').optional(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;

// =============================================================================
// TEAM MEMBER SCHEMA
// =============================================================================

export const inviteTeamMemberSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  role: z.enum(['admin', 'member', 'viewer'], { required_error: 'Please select a role' }),
});

export type InviteTeamMemberData = z.infer<typeof inviteTeamMemberSchema>;

// =============================================================================
// WEBHOOK PAYLOAD SCHEMA
// =============================================================================

export const webhookCallbackSchema = z.object({
  reportRequestId: z.string().uuid(),
  status: z.enum(['completed', 'failed']),
  data: z.record(z.unknown()).optional(),
  errorMessage: z.string().optional(),
  secret: z.string().optional(),
});

export type WebhookCallbackData = z.infer<typeof webhookCallbackSchema>;
