import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { getFavorites, addFavorite, removeFavorite, isFavorite } from '@/lib/db';
import { requireAuth } from '@/lib/api/auth';

const favoriteSchema = z.object({
  productId: z.string().optional(),
  supplierId: z.string().optional(),
}).refine(
  (data) => data.productId || data.supplierId,
  { message: 'Either productId or supplierId is required' }
);

// GET /api/favorites — List user favorites
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    const favorites = await getFavorites(auth.user.id);
    return NextResponse.json({ favorites });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/favorites — Add to favorites
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    const body = await request.json();
    const parsed = favoriteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 });
    }

    // Check if already favorited
    const existing = await isFavorite(auth.user.id, parsed.data.productId, parsed.data.supplierId);
    if (existing) {
      return NextResponse.json({ error: 'Already in favorites' }, { status: 409 });
    }

    const favorite = await addFavorite(auth.user.id, parsed.data.productId, parsed.data.supplierId);
    if (!favorite) {
      return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 });
    }

    return NextResponse.json({ favorite }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/favorites — Remove from favorites
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id') || undefined;
    const supplierId = searchParams.get('supplier_id') || undefined;

    if (!productId && !supplierId) {
      return NextResponse.json({ error: 'Either product_id or supplier_id is required' }, { status: 400 });
    }

    const success = await removeFavorite(auth.user.id, productId, supplierId);
    if (!success) {
      return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
