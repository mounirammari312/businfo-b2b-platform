import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { getQuotes, createQuote } from '@/lib/db';
import { requireAuth } from '@/lib/api/auth';

const quoteCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  quantity: z.number().int().min(1).optional(),
  unit: z.string().optional(),
  budgetMin: z.number().min(0).optional(),
  budgetMax: z.number().min(0).optional(),
  currency: z.enum(['DZD', 'EUR', 'USD']).optional(),
  deadline: z.string().optional(),
});

// GET /api/quotes — List quotes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      buyerId: searchParams.get('buyer_id') || undefined,
      supplierId: searchParams.get('supplier_id') || undefined,
      status: (searchParams.get('status') as 'open' | 'replied' | 'closed' | 'expired') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
    };

    const result = await getQuotes(filters);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/quotes — Create quote
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    const body = await request.json();
    const parsed = quoteCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 });
    }

    const quote = await createQuote({
      buyerId: auth.user.id,
      ...parsed.data,
    });

    if (!quote) {
      return NextResponse.json({ error: 'Failed to create quote' }, { status: 500 });
    }

    return NextResponse.json({ quote }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
