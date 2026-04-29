'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/index';
import { createClient } from '@/lib/supabase/client';
import { signupSchema } from '@/lib/validations';

export function SignupForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    agency_name: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const parsed = signupSchema.safeParse(formData);
    if (!parsed.success) {
      setError(parsed.error.errors[0].message);
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          data: {
            full_name: parsed.data.full_name,
            agency_name: parsed.data.agency_name,
          },
        },
      });

      if (authError) throw authError;

      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-900 dark:bg-emerald-950">
        <p className="font-medium text-emerald-600 dark:text-emerald-400">Account created!</p>
        <p className="mt-1 text-sm text-emerald-600/80 dark:text-emerald-400/80">Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="full_name">Full Name</Label>
          <Input
            id="full_name"
            placeholder="John Smith"
            value={formData.full_name}
            onChange={(e) => setFormData((p) => ({ ...p, full_name: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="agency_name">Agency Name</Label>
          <Input
            id="agency_name"
            placeholder="Acme SEO Agency"
            value={formData.agency_name}
            onChange={(e) => setFormData((p) => ({ ...p, agency_name: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@agency.com"
          autoComplete="email"
          value={formData.email}
          onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          value={formData.password}
          onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm_password">Confirm Password</Label>
        <Input
          id="confirm_password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          value={formData.confirm_password}
          onChange={(e) => setFormData((p) => ({ ...p, confirm_password: e.target.value }))}
          required
        />
      </div>

      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-400">
          {error}
        </p>
      )}

      <Button
        type="submit"
        loading={loading}
        className="w-full bg-brand-600 hover:bg-brand-700 text-white"
        size="lg"
      >
        Create Account
      </Button>
    </form>
  );
}
