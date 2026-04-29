import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { clientSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');

    let query = supabase.from('clients').select('*').order('name');
    if (active === 'true') query = query.eq('is_active', true);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const parsed = clientSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('clients')
      .insert({ ...parsed.data, created_by: user.id })
      .select()
      .single();

    if (error) throw error;

    await supabase.from('activity_feed').insert({
      user_id: user.id,
      entity_type: 'client',
      entity_id: data.id,
      action: 'Created client',
      description: `Created client: ${parsed.data.name}`,
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}
