'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea, Card, CardContent, CardHeader, CardTitle } from '@/components/ui/index';
import { clientSchema, type ClientFormData } from '@/lib/validations';
import { createClient } from '@/lib/supabase/client';
import type { Client } from '@/types/database';

interface ClientFormProps {
  client?: Client;
  onSuccess?: (client: Client) => void;
}

export function ClientForm({ client, onSuccess }: ClientFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(client?.logo_url || null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<Partial<ClientFormData>>({
    name: client?.name || '',
    website: client?.website || '',
    location: client?.location || '',
    brand_color: client?.brand_color || '#6272f6',
    industry: client?.industry || '',
    contact_email: client?.contact_email || '',
    contact_name: client?.contact_name || '',
    notes: client?.notes || '',
    is_active: client?.is_active ?? true,
  });

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, logo: 'Logo must be less than 2MB' }));
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const validated = clientSchema.safeParse(formData);
      if (!validated.success) {
        const fieldErrors: Record<string, string> = {};
        validated.error.errors.forEach((err) => {
          if (err.path[0]) fieldErrors[String(err.path[0])] = err.message;
        });
        setErrors(fieldErrors);
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      let logoUrl = client?.logo_url || null;

      // Upload logo if provided
      if (logoFile && user) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('client-logos')
          .upload(fileName, logoFile, { upsert: true });

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage
            .from('client-logos')
            .getPublicUrl(uploadData.path);
          logoUrl = urlData.publicUrl;
        }
      }

      const clientData = {
        ...validated.data,
        logo_url: logoUrl,
        created_by: user?.id,
      };

      let result;
      if (client?.id) {
        result = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', client.id)
          .select()
          .single();
      } else {
        result = await supabase.from('clients').insert(clientData).select().single();
      }

      if (result.error) throw result.error;

      // Log activity
      await supabase.from('activity_feed').insert({
        user_id: user?.id,
        entity_type: 'client',
        entity_id: result.data.id,
        action: client?.id ? 'Updated client' : 'Created client',
        description: `${client?.id ? 'Updated' : 'Created'} client: ${validated.data.name}`,
      });

      if (onSuccess) {
        onSuccess(result.data);
      } else {
        router.push('/clients');
        router.refresh();
      }
    } catch (error) {
      console.error('Error saving client:', error);
      setErrors({ submit: 'Failed to save client. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>Client Logo</Label>
            <div className="flex items-center gap-4">
              <div
                className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border cursor-pointer transition-colors hover:border-brand-500"
                onClick={() => fileInputRef.current?.click()}
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="h-full w-full object-cover" />
                ) : (
                  <Upload className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {logoPreview ? 'Change Logo' : 'Upload Logo'}
                </Button>
                {logoPreview && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="ml-2 text-muted-foreground"
                    onClick={() => { setLogoPreview(null); setLogoFile(null); }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
                <p className="mt-1 text-xs text-muted-foreground">PNG, JPG up to 2MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoChange}
              />
            </div>
            {errors.logo && <p className="text-xs text-rose-500">{errors.logo}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Client Name *</Label>
              <Input
                id="name"
                placeholder="Acme Corporation"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              />
              {errors.name && <p className="text-xs text-rose-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://example.com"
                value={formData.website}
                onChange={(e) => setFormData((p) => ({ ...p, website: e.target.value }))}
              />
              {errors.website && <p className="text-xs text-rose-500">{errors.website}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="New York, USA"
                value={formData.location}
                onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                placeholder="Technology"
                value={formData.industry}
                onChange={(e) => setFormData((p) => ({ ...p, industry: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_name">Contact Name</Label>
              <Input
                id="contact_name"
                placeholder="John Smith"
                value={formData.contact_name}
                onChange={(e) => setFormData((p) => ({ ...p, contact_name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                type="email"
                placeholder="john@example.com"
                value={formData.contact_email}
                onChange={(e) => setFormData((p) => ({ ...p, contact_email: e.target.value }))}
              />
              {errors.contact_email && <p className="text-xs text-rose-500">{errors.contact_email}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand_color">Brand Color</Label>
            <div className="flex items-center gap-3">
              <input
                id="brand_color"
                type="color"
                value={formData.brand_color}
                onChange={(e) => setFormData((p) => ({ ...p, brand_color: e.target.value }))}
                className="h-9 w-16 cursor-pointer rounded-lg border border-input"
              />
              <Input
                value={formData.brand_color}
                onChange={(e) => setFormData((p) => ({ ...p, brand_color: e.target.value }))}
                placeholder="#6272f6"
                className="w-32"
              />
            </div>
            {errors.brand_color && <p className="text-xs text-rose-500">{errors.brand_color}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes about this client..."
              value={formData.notes}
              onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {errors.submit && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-400">
          {errors.submit}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" loading={loading} className="bg-brand-600 hover:bg-brand-700 text-white">
          {client?.id ? 'Update Client' : 'Create Client'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
