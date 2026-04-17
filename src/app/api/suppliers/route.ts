import { NextRequest, NextResponse } from 'next/server';
import { getSuppliers, getSupplierById, getTopSuppliers, searchSuppliers, getSupplierBadges } from '@/lib/db';

// GET /api/suppliers — List/search suppliers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const action = searchParams.get('action');
    const id = searchParams.get('id');

    // Single supplier by id
    if (id) {
      const supplier = await getSupplierById(id);
      if (!supplier) {
        return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
      }
      const badges = await getSupplierBadges(id);
      return NextResponse.json({ supplier, badges });
    }

    // Top suppliers
    if (action === 'top') {
      const limit = parseInt(searchParams.get('limit') || '10');
      const suppliers = await getTopSuppliers(limit);
      return NextResponse.json({ suppliers });
    }

    // Search
    if (action === 'search') {
      const query = searchParams.get('q');
      if (!query) {
        return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
      }
      const suppliers = await searchSuppliers(query);
      return NextResponse.json({ suppliers });
    }

    // Paginated list
    const filters = {
      category: searchParams.get('category') || undefined,
      city: searchParams.get('city') || undefined,
      search: searchParams.get('search') || undefined,
      status: (searchParams.get('status') as 'active' | 'suspended') || undefined,
      sortBy: (searchParams.get('sort_by') as 'newest' | 'rating' | 'products' | 'name') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '12'),
    };

    const result = await getSuppliers(filters);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
