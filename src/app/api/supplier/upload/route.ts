import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/supplier/upload — Get signed upload URL
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const path = formData.get('path') as string | null;
    const bucket = (formData.get('bucket') as string) || 'product-images';

    if (!file || !path) {
      return NextResponse.json({ error: 'Missing file or path' }, { status: 400 });
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { cacheControl: '3600', upsert: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

    return NextResponse.json({
      path: data.path,
      url: urlData?.publicUrl,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
