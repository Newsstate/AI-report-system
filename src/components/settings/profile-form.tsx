'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input, Label, Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/index';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/database';

interface ProfileSettingsFormProps {
  profile: Profile | null;
  email: string;
}

export function ProfileSettingsForm({ profile, email }: ProfileSettingsFormProps) {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    agency_name: profile?.agency_name || '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('profiles').update(formData).eq('id', user.id);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Update your account information</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} disabled className="opacity-60" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData(p => ({ ...p, full_name: e.target.value }))}
                placeholder="John Smith"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agency_name">Agency Name</Label>
              <Input
                id="agency_name"
                value={formData.agency_name}
                onChange={(e) => setFormData(p => ({ ...p, agency_name: e.target.value }))}
                placeholder="Acme SEO Agency"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" loading={loading} className="bg-brand-600 hover:bg-brand-700 text-white">
              Save Changes
            </Button>
            {saved && <span className="text-sm text-emerald-500">✓ Saved successfully</span>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
