import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { getBadgeRequests, createBadgeRequest } from '@/lib/db';
import { requireAuth } from '@/lib/api/auth';

const badgeRequestSchema = z.object({
  supplierId: z.string().min(1, 'Supplier ID is required'),
  badgeTypeId: z.string().min(1, 'Badge type ID is required'),
  message: z.string().optional(),
});

// GET /api/badges/requests — List badge requests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      supplierId: searchParams.get('supplier_id') || undefined,
      status: (searchParams.get('status') as 'pending' | 'approved' | 'rejected') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
    };

    const result = await getBadgeRequests(filters);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/badges/requests — Create badge request
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    const body = await request.json();
    const parsed = badgeRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 });
    }

    const badgeRequest = await createBadgeRequest(
      parsed.data.supplierId,
      parsed.data.badgeTypeId,
      parsed.data.message,
    );

    if (!badgeRequest) {
      return NextResponse.json({ error: 'Failed to create badge request' }, { status: 500 });
    }

    return NextResponse.json({ badgeRequest }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
