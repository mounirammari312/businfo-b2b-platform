import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { getReviews, createReview, getAverageRating } from '@/lib/db';
import { requireAuth } from '@/lib/api/auth';

const reviewCreateSchema = z.object({
  productId: z.string().optional(),
  supplierId: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().optional(),
  comment: z.string().optional(),
}).refine(
  (data) => data.productId || data.supplierId,
  { message: 'Either productId or supplierId is required' }
);

// GET /api/reviews — List reviews
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');
    const supplierId = searchParams.get('supplier_id');

    // Average rating endpoint
    if (supplierId && searchParams.get('avg') === 'true') {
      const avg = await getAverageRating(supplierId);
      return NextResponse.json(avg);
    }

    const filters = {
      productId: productId || undefined,
      supplierId: supplierId || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
    };

    const result = await getReviews(filters);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/reviews — Create review
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    const body = await request.json();
    const parsed = reviewCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 });
    }

    const review = await createReview({
      buyerId: auth.user.id,
      ...parsed.data,
    });

    if (!review) {
      return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
    }

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
