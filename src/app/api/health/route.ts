import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV,
    services: {
      supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      openai: !!process.env.OPENAI_API_KEY,
      n8n: !!process.env.N8N_WEBHOOK_URL,
    },
  });
}
