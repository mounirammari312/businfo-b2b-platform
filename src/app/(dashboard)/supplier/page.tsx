'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLocaleStore } from '@/lib/store';
import { formatPrice, formatDate, cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Package,
  ShoppingCart,
  DollarSign,
  Star,
  Plus,
  Award,
  Megaphone,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import Link from 'next/link';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DashboardStats {
  productsCount: number;
  ordersCount: number;
  totalRevenue: number;
  avgRating: number;
  ordersChange: number;
  revenueChange: number;
}

interface RecentOrder {
  id: string;
  buyer_name: string;
  total_amount: number;
  currency: string;
  status: string;
  created_at: string;
  items_count: number;
}

interface RecentReview {
  id: string;
  rating: number;
  title: string;
  comment: string;
  product_name: string;
  buyer_name: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, { ar: string; en: string }> = {
  pending: { ar: 'قيد الانتظار', en: 'Pending' },
  confirmed: { ar: 'مؤكد', en: 'Confirmed' },
  shipped: { ar: 'تم الشحن', en: 'Shipped' },
  delivered: { ar: 'تم التسليم', en: 'Delivered' },
  cancelled: { ar: 'ملغي', en: 'Cancelled' },
};

const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

export default function SupplierOverview() {
  const { locale } = useLocaleStore();
  const { supplier, user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([]);
  const [chartData, setChartData] = useState<{ month: string; orders: number; revenue: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supplier?.id) {
      setLoading(false);
      return;
    }
    loadDashboardData();
  }, [supplier?.id]);

  const loadDashboardData = async () => {
    try {
      // Products count
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('supplier_id', supplier!.id);

      // Orders
      const { data: ordersData, count: ordersCount } = await supabase
        .from('orders')
        .select('*, profiles!orders_buyer_id_fkey(display_name)', { count: 'exact' })
        .eq('supplier_id', supplier!.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const totalRevenue = ordersData?.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0) || 0;

      // Reviews
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*, products(name), profiles!reviews_buyer_id_fkey(display_name)')
        .eq('supplier_id', supplier!.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const avgRating = supplier?.rating || 0;

      // Chart data - generate sample monthly data
      const now = new Date();
      const currentYear = now.getFullYear();
      const chartMonths: { month: string; orders: number; revenue: number }[] = [];
      for (let m = 0; m < 6; m++) {
        const monthDate = new Date(currentYear, now.getMonth() - (5 - m));
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).toISOString();
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1).toISOString();

        const { count: monthOrders } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('supplier_id', supplier!.id)
          .gte('created_at', monthStart)
          .lt('created_at', monthEnd);

        const { data: monthOrdersData } = await supabase
          .from('orders')
          .select('total_amount')
          .eq('supplier_id', supplier!.id)
          .gte('created_at', monthStart)
          .lt('created_at', monthEnd);

        const monthRevenue = monthOrdersData?.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0) || 0;
        chartMonths.push({
          month: months[monthDate.getMonth()],
          orders: monthOrders || 0,
          revenue: monthRevenue,
        });
      }

      setStats({
        productsCount: productsCount || 0,
        ordersCount: ordersCount || 0,
        totalRevenue,
        avgRating,
        ordersChange: 12,
        revenueChange: 8,
      });

      setRecentOrders((ordersData || []).map(o => ({
        id: o.id,
        buyer_name: (o.profiles as Record<string, string>)?.display_name || '—',
        total_amount: Number(o.total_amount) || 0,
        currency: o.currency || 'DZD',
        status: o.status,
        created_at: o.created_at,
        items_count: 0,
      })));

      setRecentReviews((reviewsData || []).map(r => ({
        id: r.id,
        rating: r.rating,
        title: r.title || '',
        comment: r.comment || '',
        product_name: (r.products as Record<string, string>)?.name || '',
        buyer_name: (r.profiles as Record<string, string>)?.display_name || '',
        created_at: r.created_at,
      })));

      setChartData(chartMonths);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const storeName = supplier?.name || (locale === 'ar' ? 'المورد' : 'Supplier');

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {locale === 'ar' ? `مرحبا، ${storeName}` : `Welcome, ${storeName}`}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {locale === 'ar' ? 'إليك نظرة عامة على متجرك' : 'Here is an overview of your store'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="bg-navy hover:bg-navy-light text-white">
            <Link href="/supplier/products/new">
              <Plus className="w-4 h-4 me-2" />
              {locale === 'ar' ? 'إضافة منتج' : 'Add Product'}
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/supplier/badges">
              <Award className="w-4 h-4 me-2" />
              {locale === 'ar' ? 'طلب شارة' : 'Request Badge'}
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/supplier/ads">
              <Megaphone className="w-4 h-4 me-2" />
              {locale === 'ar' ? 'طلب إعلان' : 'Request Ad'}
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{locale === 'ar' ? 'المنتجات' : 'Products'}</p>
                  <p className="text-2xl font-bold mt-1">{stats?.productsCount || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-navy/10 flex items-center justify-center">
                  <Package className="w-6 h-6 text-navy" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{locale === 'ar' ? 'إجمالي الطلبات' : 'Total Orders'}</p>
                  <p className="text-2xl font-bold mt-1">{stats?.ordersCount || 0}</p>
                  {stats && stats.ordersChange > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <ArrowUpRight className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-xs text-green-600 font-medium">+{stats.ordersChange}%</span>
                    </div>
                  )}
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{locale === 'ar' ? 'الإيرادات' : 'Revenue'}</p>
                  <p className="text-2xl font-bold mt-1">{formatPrice(stats?.totalRevenue || 0)}</p>
                  {stats && stats.revenueChange > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <ArrowUpRight className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-xs text-green-600 font-medium">+{stats.revenueChange}%</span>
                    </div>
                  )}
                </div>
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-gold-dark" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{locale === 'ar' ? 'متوسط التقييم' : 'Avg. Rating'}</p>
                  <p className="text-2xl font-bold mt-1">{stats?.avgRating?.toFixed(1) || '0.0'}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                  <Star className="w-6 h-6 text-gold" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chart + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              {locale === 'ar' ? 'الطلبات والإيرادات الشهرية' : 'Monthly Orders & Revenue'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                    />
                    <Line type="monotone" dataKey="orders" stroke="#1B3A5C" strokeWidth={2} dot={{ r: 4 }} name={locale === 'ar' ? 'الطلبات' : 'Orders'} />
                    <Line type="monotone" dataKey="revenue" stroke="#E8A838" strokeWidth={2} dot={{ r: 4 }} name={locale === 'ar' ? 'الإيرادات' : 'Revenue'} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Reviews */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                {locale === 'ar' ? 'أحدث التقييمات' : 'Recent Reviews'}
              </CardTitle>
              <Link href="/supplier/reviews" className="text-sm text-navy hover:underline">
                {locale === 'ar' ? 'عرض الكل' : 'View All'}
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : recentReviews.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                {locale === 'ar' ? 'لا توجد تقييمات بعد' : 'No reviews yet'}
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {recentReviews.slice(0, 4).map((review) => (
                  <div key={review.id} className="flex gap-3 pb-3 border-b last:border-0">
                    <div className="flex items-center gap-0.5 shrink-0 mt-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'w-3.5 h-3.5',
                            i < review.rating ? 'fill-gold text-gold' : 'text-muted-foreground/30'
                          )}
                        />
                      ))}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{review.title || review.product_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{review.comment}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{review.product_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              {locale === 'ar' ? 'أحدث الطلبات' : 'Recent Orders'}
            </CardTitle>
            <Link href="/supplier/orders" className="text-sm text-navy hover:underline">
              {locale === 'ar' ? 'عرض الكل' : 'View All'}
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {locale === 'ar' ? 'لا توجد طلبات بعد' : 'No orders yet'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{locale === 'ar' ? 'رقم الطلب' : 'Order #'}</TableHead>
                    <TableHead>{locale === 'ar' ? 'المشتري' : 'Buyer'}</TableHead>
                    <TableHead>{locale === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                    <TableHead>{locale === 'ar' ? 'المبلغ' : 'Total'}</TableHead>
                    <TableHead>{locale === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">
                        #{order.id.slice(0, 8)}
                      </TableCell>
                      <TableCell className="text-sm">{order.buyer_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(order.created_at, locale)}
                      </TableCell>
                      <TableCell className="text-sm font-semibold">
                        {formatPrice(order.total_amount, order.currency)}
                      </TableCell>
                      <TableCell>
                        <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', statusColors[order.status])}>
                          {(statusLabels[order.status]?.[locale === 'ar' ? 'ar' : 'en']) || order.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
