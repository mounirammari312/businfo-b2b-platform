import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/api/auth';

// POST /api/upload — Upload file to Supabase Storage
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const path = formData.get('path') as string | null;
    const bucket = (formData.get('bucket') as string) || 'product-images';

    if (!file || !path) {
      return NextResponse.json({ error: 'Missing file or path' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only images are allowed.' }, { status: 400 });
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
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
