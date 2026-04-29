'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, Calendar, Zap, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea, Card, CardContent, CardHeader, CardTitle } from '@/components/ui/index';
import { reportRequestSchema } from '@/lib/validations';
import { createClient } from '@/lib/supabase/client';
import { REPORT_TYPE_LABELS } from '@/lib/utils';
import type { Client } from '@/types/database';

interface NewReportFormProps {
  clients: Client[];
}

const REPORT_TYPES = Object.entries(REPORT_TYPE_LABELS).map(([value, label]) => ({ value, label }));
const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export function NewReportForm({ clients }: NewReportFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    client_id: '',
    report_type: 'monthly_seo' as string,
    date_range_start: '',
    date_range_end: '',
    keywords: '',
    work_done_notes: '',
    custom_instructions: '',
    priority: 'normal',
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];

    if (!allowedTypes.includes(file.type)) {
      setErrors((prev) => ({ ...prev, excel: 'Please upload an Excel (.xlsx, .xls) or CSV file' }));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, excel: 'File must be less than 10MB' }));
      return;
    }

    setExcelFile(file);
    setErrors((prev) => ({ ...prev, excel: '' }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const validated = reportRequestSchema.safeParse(formData);
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
      if (!user) throw new Error('Not authenticated');

      let excelFileUrl = null;
      let excelFileName = null;

      // Upload Excel file if provided
      if (excelFile) {
        const fileExt = excelFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('report-uploads')
          .upload(fileName, excelFile);

        if (uploadError) {
          console.warn('Excel upload failed:', uploadError.message);
          // Continue without file rather than blocking submission
        } else if (uploadData) {
          const { data: signedUrl } = await supabase.storage
            .from('report-uploads')
            .createSignedUrl(uploadData.path, 7 * 24 * 60 * 60); // 7 days
          excelFileUrl = signedUrl?.signedUrl || null;
          excelFileName = excelFile.name;
        }
      }

      // Create the report request
      const { data: reportRequest, error } = await supabase
        .from('report_requests')
        .insert({
          client_id: validated.data.client_id,
          requested_by: user.id,
          report_type: validated.data.report_type as any,
          status: 'pending',
          date_range_start: validated.data.date_range_start,
          date_range_end: validated.data.date_range_end,
          keywords: validated.data.keywords,
          work_done_notes: validated.data.work_done_notes || null,
          custom_instructions: validated.data.custom_instructions || null,
          excel_file_url: excelFileUrl,
          excel_file_name: excelFileName,
          priority: validated.data.priority as any,
          retry_count: 0,
        })
        .select()
        .single();

      if (error) throw error;

      // Trigger n8n automation via API route
      const client = clients.find((c) => c.id === validated.data.client_id);
      const triggerResponse = await fetch('/api/automation/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportRequestId: reportRequest.id,
          clientName: client?.name,
          clientWebsite: client?.website,
        }),
      });

      // Log activity
      await supabase.from('activity_feed').insert({
        user_id: user.id,
        entity_type: 'report_request',
        entity_id: reportRequest.id,
        action: 'Report request submitted',
        description: `${REPORT_TYPE_LABELS[validated.data.report_type]} for ${client?.name}`,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/reports');
        router.refresh();
      }, 1500);
    } catch (error) {
      console.error('Error creating report request:', error);
      setErrors({ submit: 'Failed to submit report request. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
          <Zap className="h-8 w-8 text-emerald-500" />
        </div>
        <h3 className="mt-4 text-xl font-semibold">Report Request Submitted!</h3>
        <p className="mt-2 text-muted-foreground">
          Your automation workflow has been triggered. Redirecting to reports...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Client & Report Type */}
      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="client_id">Client *</Label>
              <select
                id="client_id"
                value={formData.client_id}
                onChange={(e) => setFormData((p) => ({ ...p, client_id: e.target.value }))}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select a client...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
              {errors.client_id && <p className="text-xs text-rose-500">{errors.client_id}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="report_type">Report Type *</Label>
              <select
                id="report_type"
                value={formData.report_type}
                onChange={(e) => setFormData((p) => ({ ...p, report_type: e.target.value }))}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {REPORT_TYPES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              {errors.report_type && <p className="text-xs text-rose-500">{errors.report_type}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_range_start">Date Range Start *</Label>
              <Input
                id="date_range_start"
                type="date"
                value={formData.date_range_start}
                onChange={(e) => setFormData((p) => ({ ...p, date_range_start: e.target.value }))}
              />
              {errors.date_range_start && <p className="text-xs text-rose-500">{errors.date_range_start}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_range_end">Date Range End *</Label>
              <Input
                id="date_range_end"
                type="date"
                value={formData.date_range_end}
                onChange={(e) => setFormData((p) => ({ ...p, date_range_end: e.target.value }))}
              />
              {errors.date_range_end && <p className="text-xs text-rose-500">{errors.date_range_end}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => setFormData((p) => ({ ...p, priority: e.target.value }))}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {PRIORITIES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keywords & Notes */}
      <Card>
        <CardHeader>
          <CardTitle>SEO Context</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="keywords">Target Keywords</Label>
            <Textarea
              id="keywords"
              placeholder="Enter one keyword per line:&#10;seo agency london&#10;digital marketing services&#10;local seo consultant"
              value={formData.keywords}
              onChange={(e) => setFormData((p) => ({ ...p, keywords: e.target.value }))}
              rows={5}
            />
            <p className="text-xs text-muted-foreground">Enter one keyword per line</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="work_done_notes">Work Done This Period</Label>
            <Textarea
              id="work_done_notes"
              placeholder="Describe the SEO work completed this period: content created, links built, technical fixes, etc."
              value={formData.work_done_notes}
              onChange={(e) => setFormData((p) => ({ ...p, work_done_notes: e.target.value }))}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom_instructions">Custom Instructions for AI</Label>
            <Textarea
              id="custom_instructions"
              placeholder="Any specific instructions for AI report generation, focus areas, or client-specific context..."
              value={formData.custom_instructions}
              onChange={(e) => setFormData((p) => ({ ...p, custom_instructions: e.target.value }))}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Data Upload</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-8 text-center transition-colors hover:border-brand-500 hover:bg-brand-50/5"
            onClick={() => fileInputRef.current?.click()}
          >
            {excelFile ? (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Upload className="h-6 w-6 text-emerald-500" />
                </div>
                <p className="mt-3 font-medium">{excelFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(excelFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-muted-foreground"
                  onClick={(e) => { e.stopPropagation(); setExcelFile(null); }}
                >
                  <X className="mr-1.5 h-3.5 w-3.5" /> Remove file
                </Button>
              </>
            ) : (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="mt-3 font-medium">Upload Excel / CSV Data</p>
                <p className="text-sm text-muted-foreground">
                  GSC export, Analytics data, ranking reports...
                </p>
                <p className="mt-1 text-xs text-muted-foreground">XLSX, XLS, CSV up to 10MB</p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileChange}
          />
          {errors.excel && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-rose-500">
              <AlertCircle className="h-3.5 w-3.5" />
              {errors.excel}
            </p>
          )}
        </CardContent>
      </Card>

      {errors.submit && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-400">
          {errors.submit}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          loading={loading}
          size="lg"
          className="bg-brand-600 hover:bg-brand-700 text-white"
        >
          <Zap className="mr-2 h-4 w-4" />
          Submit & Trigger Automation
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
