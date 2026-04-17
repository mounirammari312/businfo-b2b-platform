import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { getSupplierById, updateSupplier, getSupplierBadges } from '@/lib/db';

const supplierUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  nameEn: z.string().optional(),
  description: z.string().optional(),
  descriptionEn: z.string().optional(),
  logoUrl: z.string().optional(),
  coverUrl: z.string().optional(),
  category: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  addressEn: z.string().optional(),
  city: z.string().optional(),
  status: z.enum(['active', 'suspended']).optional(),
  isVerified: z.boolean().optional(),
});

// GET /api/suppliers/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supplier = await getSupplierById(id);

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    const badges = await getSupplierBadges(id);
    return NextResponse.json({ supplier, badges });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/suppliers/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = supplierUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 });
    }

    const success = await updateSupplier(id, parsed.data);
    if (!success) {
      return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 });
    }

    const updated = await getSupplierById(id);
    return NextResponse.json({ supplier: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
