import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { createQuoteReply, getQuoteById } from '@/lib/db';
import { requireAuth } from '@/lib/api/auth';

const quoteReplySchema = z.object({
  supplierId: z.string().min(1, 'Supplier ID is required'),
  pricePerUnit: z.number().min(0).optional(),
  currency: z.enum(['DZD', 'EUR', 'USD']).optional(),
  message: z.string().optional(),
  deliveryTime: z.string().optional(),
});

// POST /api/quotes/[id]/replies — Add a reply to a quote
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    const { id } = await params;
    const body = await request.json();
    const parsed = quoteReplySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 });
    }

    // Verify the quote exists
    const quote = await getQuoteById(id);
    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    const reply = await createQuoteReply(id, parsed.data);
    if (!reply) {
      return NextResponse.json({ error: 'Failed to create reply' }, { status: 500 });
    }

    return NextResponse.json({ reply }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
