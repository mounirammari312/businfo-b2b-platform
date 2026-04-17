import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/supplier/products — List supplier products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get('supplier_id');
    const status = searchParams.get('status');
    const categoryId = searchParams.get('category_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');

    if (!supplierId) {
      return NextResponse.json({ error: 'supplier_id is required' }, { status: 400 });
    }

    let query = supabase
      .from('products')
      .select('*, categories(name, name_en), product_images(url, is_primary)', { count: 'exact' })
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter by search on client side
    let results = data || [];
    if (search) {
      const s = search.toLowerCase();
      results = results.filter(p =>
        (p.name && p.name.toLowerCase().includes(s)) ||
        (p.name_en && p.name_en.toLowerCase().includes(s))
      );
    }

    return NextResponse.json({
      products: results,
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/supplier/products — Create product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { supplier_id, name, name_en, description, description_en, price, currency, category_id, subcategory_id, min_order, unit, stock_quantity, status, slug } = body;

    if (!supplier_id || !name || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        supplier_id,
        name,
        name_en: name_en || null,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        description: description || null,
        description_en: description_en || null,
        price,
        currency: currency || 'DZD',
        category_id: category_id || null,
        subcategory_id: subcategory_id || null,
        min_order: min_order || 1,
        unit: unit || 'piece',
        stock_quantity: stock_quantity || null,
        in_stock: !stock_quantity || Number(stock_quantity) > 0,
        status: status || 'active',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ product: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
