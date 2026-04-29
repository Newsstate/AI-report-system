import { z } from 'zod';

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key required').optional(),

  // OpenAI
  OPENAI_API_KEY: z.string().startsWith('sk-', 'Invalid OpenAI API key').optional(),
  OPENAI_MODEL: z.string().default('gpt-4o'),
  OPENAI_MAX_TOKENS: z.coerce.number().default(4096),

  // n8n
  N8N_WEBHOOK_URL: z.string().url('Invalid n8n webhook URL').optional(),
  N8N_WEBHOOK_SECRET: z.string().optional(),
  N8N_API_URL: z.string().url().optional(),
  N8N_API_KEY: z.string().optional(),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_APP_NAME: z.string().default('AI SEO Platform'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Storage
  SUPABASE_STORAGE_BUCKET_LOGOS: z.string().default('client-logos'),
  SUPABASE_STORAGE_BUCKET_UPLOADS: z.string().default('report-uploads'),
  SUPABASE_STORAGE_BUCKET_REPORTS: z.string().default('generated-reports'),

  // Security
  INTERNAL_API_SECRET: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  // In browser, only NEXT_PUBLIC_ vars are available
  if (typeof window !== 'undefined') {
    return envSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
      NODE_ENV: process.env.NODE_ENV,
    });
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);

    // In development, show warnings but don't crash
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  Some env vars are missing. Running with defaults where possible.');
      return envSchema.parse({
        ...process.env,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
      });
    }

    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}

export const env = validateEnv();
