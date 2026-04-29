import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string || 'report-uploads';
    const path = formData.get('path') as string;

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    const fileExt = file.name.split('.').pop();
    const filePath = path || `${user.id}/${Date.now()}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // For public buckets, get public URL; for private, get signed URL
    let url: string;
    if (bucket === 'client-logos') {
      const { data } = supabase.storage.from(bucket).getPublicUrl(uploadData.path);
      url = data.publicUrl;
    } else {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(uploadData.path, 7 * 24 * 60 * 60); // 7 days
      if (error || !data) throw new Error('Failed to create signed URL');
      url = data.signedUrl;
    }

    return NextResponse.json({
      success: true,
      path: uploadData.path,
      url,
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (error) {
    console.error('Upload route error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
