import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/supplier/orders — List supplier orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get('supplier_id');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!supplierId) {
      return NextResponse.json({ error: 'supplier_id is required' }, { status: 400 });
    }

    let query = supabase
      .from('orders')
      .select('*, profiles!orders_buyer_id_fkey(display_name)', { count: 'exact' })
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      orders: data || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
