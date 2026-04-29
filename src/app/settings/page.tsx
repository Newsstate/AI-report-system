import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/index';
import { ProfileSettingsForm } from '@/components/settings/profile-form';
import { IntegrationStatus } from '@/components/settings/integration-status';

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single();

  const n8nConfigured = !!process.env.N8N_WEBHOOK_URL;
  const openaiConfigured = !!process.env.OPENAI_API_KEY;

  return (
    <div className="p-8 max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and integrations</p>
      </div>

      <ProfileSettingsForm profile={profile} email={user?.email || ''} />

      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>Status of your third-party integrations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <IntegrationStatus
            name="n8n Automation"
            description="Workflow automation engine"
            configured={n8nConfigured}
            url={process.env.N8N_WEBHOOK_URL}
          />
          <IntegrationStatus
            name="OpenAI"
            description="AI report generation"
            configured={openaiConfigured}
          />
          <IntegrationStatus
            name="Supabase"
            description="Database & authentication"
            configured={true}
            url={process.env.NEXT_PUBLIC_SUPABASE_URL}
          />
        </CardContent>
      </Card>
    </div>
  );
}
