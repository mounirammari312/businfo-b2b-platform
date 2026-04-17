import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { getOrders, getOrderById, createOrder, updateOrderStatus } from '@/lib/db';
import { requireAuth } from '@/lib/api/auth';

const orderCreateSchema = z.object({
  supplierId: z.string().min(1, 'Supplier ID is required'),
  items: z.array(z.object({
    productId: z.string().min(1),
    productName: z.string().min(1),
    quantity: z.number().int().min(1),
    unitPrice: z.number().min(0),
    variationId: z.string().optional(),
  })).min(1, 'At least one item is required'),
  notes: z.string().optional(),
  shippingAddress: z.string().optional(),
  currency: z.enum(['DZD', 'EUR', 'USD']).optional(),
});

// GET /api/orders — List orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      buyerId: searchParams.get('buyer_id') || undefined,
      supplierId: searchParams.get('supplier_id') || undefined,
      status: (searchParams.get('status') as 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
    };

    const result = await getOrders(filters);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/orders — Create order
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    const body = await request.json();
    const parsed = orderCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 });
    }

    const order = await createOrder({
      buyerId: auth.user.id,
      ...parsed.data,
    });

    if (!order) {
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
