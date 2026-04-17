import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { getProductById, updateProductRow, deleteProduct } from '@/lib/db';

const productUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  nameEn: z.string().optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  descriptionEn: z.string().optional(),
  price: z.number().min(0).optional(),
  currency: z.enum(['DZD', 'EUR', 'USD']).optional(),
  categoryId: z.string().nullable().optional(),
  subcategoryId: z.string().nullable().optional(),
  minOrder: z.number().int().min(1).optional(),
  unit: z.string().optional(),
  stockQuantity: z.number().int().min(0).nullable().optional(),
  inStock: z.boolean().optional(),
  status: z.enum(['active', 'draft', 'archived']).optional(),
  isFeatured: z.boolean().optional(),
});

// GET /api/products/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await getProductById(id);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/products/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = productUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 });
    }

    const success = await updateProductRow(id, parsed.data);
    if (!success) {
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }

    const updated = await getProductById(id);
    return NextResponse.json({ product: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/products/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await deleteProduct(id);

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
