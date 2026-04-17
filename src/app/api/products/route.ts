import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { getProducts, getProductById, createProductRow, updateProductRow, deleteProduct, getFeaturedProducts, getRelatedProducts, searchProducts } from '@/lib/db';

const productCreateSchema = z.object({
  supplierId: z.string().min(1, 'Supplier ID is required'),
  name: z.string().min(1, 'Product name is required'),
  nameEn: z.string().optional(),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  descriptionEn: z.string().optional(),
  price: z.number().min(0, 'Price must be positive'),
  currency: z.enum(['DZD', 'EUR', 'USD']).optional(),
  categoryId: z.string().optional(),
  subcategoryId: z.string().optional(),
  minOrder: z.number().int().min(1).optional(),
  unit: z.string().optional(),
  stockQuantity: z.number().int().min(0).optional(),
  status: z.enum(['active', 'draft', 'archived']).optional(),
  isFeatured: z.boolean().optional(),
});

// GET /api/products — List/search products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filters = {
      category: searchParams.get('category') || undefined,
      subcategory: searchParams.get('subcategory') || undefined,
      search: searchParams.get('search') || undefined,
      supplierId: searchParams.get('supplier_id') || undefined,
      status: (searchParams.get('status') as 'active' | 'draft' | 'archived') || undefined,
      sortBy: (searchParams.get('sort_by') as 'newest' | 'price_asc' | 'price_desc' | 'popular' | 'rating') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '12'),
      isFeatured: searchParams.get('featured') === 'true' ? true : undefined,
    };

    // Special endpoints
    const featured = searchParams.get('featured');
    const relatedTo = searchParams.get('related_to');
    const categoryForRelated = searchParams.get('category');

    if (featured === 'true') {
      const products = await getFeaturedProducts(filters.limit || 12);
      return NextResponse.json({ products, total: products.length });
    }

    if (relatedTo && categoryForRelated) {
      const products = await getRelatedProducts(relatedTo, categoryForRelated);
      return NextResponse.json({ products, total: products.length });
    }

    const result = await getProducts(filters);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/products — Create product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = productCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 });
    }

    const product = await createProductRow(parsed.data);
    if (!product) {
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
