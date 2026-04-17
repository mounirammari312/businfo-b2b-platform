import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { getAdRequests, createAdRequest } from '@/lib/db';
import { requireAuth } from '@/lib/api/auth';

const adRequestSchema = z.object({
  supplierId: z.string().min(1, 'Supplier ID is required'),
  adTypeId: z.string().min(1, 'Ad type ID is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  targetUrl: z.string().optional(),
  message: z.string().optional(),
});

// GET /api/ads/requests — List ad requests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      supplierId: searchParams.get('supplier_id') || undefined,
      status: (searchParams.get('status') as 'pending' | 'active' | 'rejected' | 'expired') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
    };

    const result = await getAdRequests(filters);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/ads/requests — Create ad request
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    const body = await request.json();
    const parsed = adRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 });
    }

    const adRequest = await createAdRequest(parsed.data);

    if (!adRequest) {
      return NextResponse.json({ error: 'Failed to create ad request' }, { status: 500 });
    }

    return NextResponse.json({ adRequest }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
