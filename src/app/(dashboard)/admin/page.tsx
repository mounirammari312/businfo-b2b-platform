'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  getAllProfiles,
  getAllSuppliers,
  getAllProducts,
  getAllMessages,
  getAllAds,
} from '@/lib/db';
import { formatNumber, formatPrice } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Users, Building2, Package, ShoppingCart, DollarSign,
  TrendingUp, TrendingDown, Award, Megaphone, BarChart3,
  Clock, ArrowRight, Eye, Activity,
} from 'lucide-react';

// Demo chart data
const monthlyRegistrations = [
  { month: 'يناير', users: 45, suppliers: 12 },
  { month: 'فبراير', users: 52, suppliers: 15 },
  { month: 'مارس', users: 61, suppliers: 18 },
  { month: 'أبريل', users: 48, suppliers: 22 },
  { month: 'مايو', users: 73, suppliers: 25 },
  { month: 'يونيو', users: 84, suppliers: 30 },
  { month: 'يوليو', users: 92, suppliers: 28 },
  { month: 'أغسطس', users: 78, suppliers: 33 },
  { month: 'سبتمبر', users: 95, suppliers: 35 },
  { month: 'أكتوبر', users: 110, suppliers: 40 },
  { month: 'نوفمبر', users: 125, suppliers: 45 },
  { month: 'ديسمبر', users: 140, suppliers: 50 },
];

const ordersPerMonth = [
  { month: 'يناير', orders: 30 },
  { month: 'فبراير', orders: 45 },
  { month: 'مارس', orders: 55 },
  { month: 'أبريل', orders: 40 },
  { month: 'مايو', orders: 65 },
  { month: 'يونيو', orders: 72 },
  { month: 'يوليو', orders: 80 },
  { month: 'أغسطس', orders: 68 },
  { month: 'سبتمبر', orders: 90 },
  { month: 'أكتوبر', orders: 105 },
  { month: 'نوفمبر', orders: 120 },
  { month: 'ديسمبر', orders: 135 },
];

const productsByCategory = [
  { name: 'البناء', value: 350, color: '#1B3A5C' },
  { name: 'الإلكترونيات', value: 280, color: '#E8A838' },
  { name: 'الأغذية', value: 220, color: '#059669' },
  { name: 'المنسوجات', value: 180, color: '#7C3AED' },
  { name: 'التقنية', value: 150, color: '#DC2626' },
  { name: 'أخرى', value: 200, color: '#6B7280' },
];

const revenueTrend = [
  { month: 'يناير', revenue: 120000 },
  { month: 'فبراير', revenue: 180000 },
  { month: 'مارس', revenue: 220000 },
  { month: 'أبريل', revenue: 195000 },
  { month: 'مايو', revenue: 280000 },
  { month: 'يونيو', revenue: 310000 },
  { month: 'يوليو', revenue: 350000 },
  { month: 'أغسطس', revenue: 290000 },
  { month: 'سبتمبر', revenue: 380000 },
  { month: 'أكتوبر', revenue: 420000 },
  { month: 'نوفمبر', revenue: 475000 },
  { month: 'ديسمبر', revenue: 520000 },
];

const recentActivities = [
  { id: 1, action: 'مورد جديد مسجل', detail: 'شركة النور للإلكترونيات', time: 'منذ 5 دقائق', icon: Building2, color: 'bg-green-100 text-green-600' },
  { id: 2, action: 'طلب شارة جديد', detail: 'شارة مميز ذهبي - شركة الأمل', time: 'منذ 15 دقيقة', icon: Award, color: 'bg-yellow-100 text-yellow-600' },
  { id: 3, action: 'طلب إعلان جديد', detail: 'إعلان مميز - معرض الإلكترونيات', time: 'منذ 30 دقيقة', icon: Megaphone, color: 'bg-purple-100 text-purple-600' },
  { id: 4, action: 'منتج جديد مضاف', detail: 'شاشة كمبيوتر 27 بوصة', time: 'منذ ساعة', icon: Package, color: 'bg-blue-100 text-blue-600' },
  { id: 5, action: 'طلب جديد', detail: 'طلب عرض سعر #1024', time: 'منذ ساعتين', icon: ShoppingCart, color: 'bg-orange-100 text-orange-600' },
  { id: 6, action: 'مستخدم جديد', detail: 'أحمد بن علي سجل حساب جديد', time: 'منذ 3 ساعات', icon: Users, color: 'bg-cyan-100 text-cyan-600' },
  { id: 7, action: 'تقييم جديد', detail: 'تقييم 5 نجوم لمنتج حواسيب', time: 'منذ 4 ساعات', icon: Activity, color: 'bg-pink-100 text-pink-600' },
  { id: 8, action: 'مورد معتمد', detail: 'تم اعتماد شركة البناء المتقدم', time: 'منذ 5 ساعات', icon: Eye, color: 'bg-emerald-100 text-emerald-600' },
  { id: 9, action: 'إعلان منتهي', detail: 'إعلان مخفض الشتاء انتهت صلاحيته', time: 'منذ 6 ساعات', icon: Megaphone, color: 'bg-gray-100 text-gray-600' },
  { id: 10, action: 'رسالة جديدة', detail: 'استفسار عن منتجات البناء', time: 'منذ 8 ساعات', icon: Clock, color: 'bg-indigo-100 text-indigo-600' },
];

const COLORS = ['#1B3A5C', '#E8A838', '#059669', '#7C3AED', '#DC2626', '#6B7280'];

interface StatCard {
  icon: React.ElementType;
  label: string;
  value: string;
  change: number;
  color: string;
}

export default function AdminOverview() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [dataLoading, setDataLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, suppliers: 0, products: 0, orders: 135, revenue: 520000 });

  const isAdmin = !authLoading && profile?.role === 'admin';

  // Fetch data when admin is ready
  const hasFetched = React.useRef(false);
  React.useEffect(() => {
    if (isAdmin && !hasFetched.current) {
      hasFetched.current = true;
      (async () => {
        setDataLoading(true);
        try {
          const [profiles, suppliers, products] = await Promise.all([
            getAllProfiles(),
            getAllSuppliers(),
            getAllProducts(),
          ]);
          setStats({
            users: profiles.length,
            suppliers: suppliers.length,
            products: products.length,
            orders: 135,
            revenue: 520000,
          });
        } catch {
          // Use demo data
        }
        setDataLoading(false);
      })();
    }
  }, [isAdmin]);

  if (authLoading || dataLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-4 w-32 mb-4" />
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statCards: StatCard[] = [
    { icon: Users, label: 'إجمالي المستخدمين', value: formatNumber(stats.users), change: 12.5, color: 'bg-blue-50 text-blue-600' },
    { icon: Building2, label: 'الموردين', value: formatNumber(stats.suppliers), change: 8.3, color: 'bg-emerald-50 text-emerald-600' },
    { icon: Package, label: 'المنتجات', value: formatNumber(stats.products), change: 15.2, color: 'bg-purple-50 text-purple-600' },
    { icon: ShoppingCart, label: 'الطلبات', value: formatNumber(stats.orders), change: 6.8, color: 'bg-orange-50 text-orange-600' },
    { icon: DollarSign, label: 'الإيرادات', value: formatPrice(stats.revenue), change: 22.1, color: 'bg-green-50 text-green-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className={`flex items-center gap-0.5 text-xs font-medium ${stat.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {stat.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {stat.change}%
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Registrations - Line Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#1B3A5C]" />
              التسجيلات الشهرية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyRegistrations}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="users" name="المستخدمون" stroke="#1B3A5C" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="suppliers" name="الموردون" stroke="#E8A838" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Orders per Month - Bar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-[#1B3A5C]" />
              الطلبات الشهرية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ordersPerMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                  <Bar dataKey="orders" name="الطلبات" fill="#1B3A5C" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Products by Category - Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Package className="w-4 h-4 text-[#1B3A5C]" />
              المنتجات حسب التصنيف
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={productsByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {productsByCategory.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Trend - Area Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#1B3A5C]" />
              اتجاه الإيرادات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                    formatter={(value: number) => [formatPrice(value), 'الإيرادات']}
                  />
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1B3A5C" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#1B3A5C" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="الإيرادات"
                    stroke="#1B3A5C"
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Activity Feed + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#1B3A5C]" />
              آخر الأنشطة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-lg ${activity.color} flex items-center justify-center shrink-0`}>
                    <activity.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{activity.action}</p>
                    <p className="text-xs text-gray-500 truncate">{activity.detail}</p>
                  </div>
                  <span className="text-[11px] text-gray-400 whitespace-nowrap shrink-0">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">إجراءات سريعة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/admin/badges">
                <Button variant="outline" className="w-full justify-start gap-2 text-sm h-10">
                  <Award className="w-4 h-4 text-[#E8A838]" />
                  إدارة الشارات
                  <ArrowRight className="w-3.5 h-3.5 mr-auto text-gray-400" />
                </Button>
              </Link>
              <Link href="/admin/ads">
                <Button variant="outline" className="w-full justify-start gap-2 text-sm h-10">
                  <Megaphone className="w-4 h-4 text-purple-500" />
                  إدارة الإعلانات
                  <ArrowRight className="w-3.5 h-3.5 mr-auto text-gray-400" />
                </Button>
              </Link>
              <Link href="/admin/reports">
                <Button variant="outline" className="w-full justify-start gap-2 text-sm h-10">
                  <BarChart3 className="w-4 h-4 text-[#1B3A5C]" />
                  عرض التقارير
                  <ArrowRight className="w-3.5 h-3.5 mr-auto text-gray-400" />
                </Button>
              </Link>
              <Link href="/admin/suppliers">
                <Button variant="outline" className="w-full justify-start gap-2 text-sm h-10">
                  <Building2 className="w-4 h-4 text-emerald-500" />
                  إدارة الموردين
                  <ArrowRight className="w-3.5 h-3.5 mr-auto text-gray-400" />
                </Button>
              </Link>
              <Link href="/admin/messages">
                <Button variant="outline" className="w-full justify-start gap-2 text-sm h-10">
                  <Activity className="w-4 h-4 text-orange-500" />
                  المراسلات
                  <ArrowRight className="w-3.5 h-3.5 mr-auto text-gray-400" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
