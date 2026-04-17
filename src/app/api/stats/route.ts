import { NextRequest, NextResponse } from 'next/server';
import {
  getPlatformStats,
  getMonthlyRegistrations,
  getMonthlyOrders,
  getTopProducts,
  getTopSuppliersBySales,
} from '@/lib/db';
import { requireRole } from '@/lib/api/auth';

// GET /api/stats — Platform statistics (admin only)
export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['admin']);
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');

    switch (section) {
      case 'overview': {
        const stats = await getPlatformStats();
        return NextResponse.json(stats);
      }

      case 'registrations': {
        const data = await getMonthlyRegistrations();
        return NextResponse.json({ data });
      }

      case 'orders': {
        const data = await getMonthlyOrders();
        return NextResponse.json({ data });
      }

      case 'top-products': {
        const limit = parseInt(searchParams.get('limit') || '10');
        const data = await getTopProducts(limit);
        return NextResponse.json({ data });
      }

      case 'top-suppliers': {
        const limit = parseInt(searchParams.get('limit') || '10');
        const data = await getTopSuppliersBySales(limit);
        return NextResponse.json({ data });
      }

      default: {
        // Return all stats
        const [stats, registrations, orders, topProducts, topSuppliers] = await Promise.all([
          getPlatformStats(),
          getMonthlyRegistrations(),
          getMonthlyOrders(),
          getTopProducts(10),
          getTopSuppliersBySales(10),
        ]);

        return NextResponse.json({
          stats,
          registrations,
          orders,
          topProducts,
          topSuppliers,
        });
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
