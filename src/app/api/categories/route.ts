import { NextRequest, NextResponse } from 'next/server';
import { getCategories, getCategoryBySlug, getSubcategories } from '@/lib/db';

// GET /api/categories — List categories or get by slug
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const categoryId = searchParams.get('category_id');
    const subcategories = searchParams.get('subcategories');

    // Get subcategories for a category
    if (categoryId && subcategories === 'true') {
      const subs = await getSubcategories(categoryId);
      return NextResponse.json({ subcategories: subs });
    }

    // Get category by slug
    if (slug) {
      const category = await getCategoryBySlug(slug);
      if (!category) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 });
      }
      return NextResponse.json({ category });
    }

    // List all categories
    const categories = await getCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
