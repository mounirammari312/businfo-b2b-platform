'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { formatNumber, formatPrice } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  BarChart3, Download, CalendarDays, TrendingUp, DollarSign,
  Users, Package, ShoppingCart, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

// Demo chart data
const revenueOverTime = [
  { month: 'يناير', revenue: 120000, orders: 30 },
  { month: 'فبراير', revenue: 180000, orders: 45 },
  { month: 'مارس', revenue: 220000, orders: 55 },
  { month: 'أبريل', revenue: 195000, orders: 40 },
  { month: 'مايو', revenue: 280000, orders: 65 },
  { month: 'يونيو', revenue: 310000, orders: 72 },
  { month: 'يوليو', revenue: 350000, orders: 80 },
  { month: 'أغسطس', revenue: 290000, orders: 68 },
  { month: 'سبتمبر', revenue: 380000, orders: 90 },
  { month: 'أكتوبر', revenue: 420000, orders: 105 },
  { month: 'نوفمبر', revenue: 475000, orders: 120 },
  { month: 'ديسمبر', revenue: 520000, orders: 135 },
];

const ordersByStatus = [
  { name: 'معلق', value: 25, color: '#E8A838' },
  { name: 'مؤكد', value: 35, color: '#1B3A5C' },
  { name: 'مُرسل', value: 20, color: '#059669' },
  { name: 'تم التسليم', value: 15, color: '#7C3AED' },
  { name: 'ملغي', value: 5, color: '#DC2626' },
];

const topSuppliers = [
  { name: 'شركة النور للإلكترونيات', sales: 450000 },
  { name: 'مؤسسة البناء المتقدم', sales: 380000 },
  { name: 'شركة الأمل للأغذية', sales: 320000 },
  { name: 'معرض التقنية الحديثة', sales: 290000 },
  { name: 'شركة الخليج للمنسوجات', sales: 250000 },
  { name: 'مصنع الحديد الوطني', sales: 220000 },
  { name: 'شركة السلام للكيماويات', sales: 190000 },
  { name: 'معرض الأثاث الحديث', sales: 170000 },
  { name: 'شركة النجاح للمعدات', sales: 150000 },
  { name: 'مؤسسة الإبداع', sales: 130000 },
];

const topProducts = [
  { name: 'حواسيب محمولة', sales: 1250 },
  { name: 'إسمنت CPJ 42.5', sales: 980 },
  { name: 'شاشات كمبيوتر 27"', sales: 870 },
  { name: 'زيت زيتون ممتاز', sales: 760 },
  { name: 'حديد التسليح', sales: 690 },
  { name: 'أقمشة قطنية', sales: 620 },
  { name: 'طابعات ليزر', sales: 550 },
  { name: 'أنابيب PVC', sales: 480 },
  { name: 'حواسيب مكتبي', sales: 420 },
  { name: 'دهانات داخلية', sales: 380 },
];

const userGrowth = [
  { month: 'يناير', users: 45 },
  { month: 'فبراير', users: 52 },
  { month: 'مارس', users: 61 },
  { month: 'أبريل', users: 48 },
  { month: 'مايو', users: 73 },
  { month: 'يونيو', users: 84 },
  { month: 'يوليو', users: 92 },
  { month: 'أغسطس', users: 78 },
  { month: 'سبتمبر', users: 95 },
  { month: 'أكتوبر', users: 110 },
  { month: 'نوفمبر', users: 125 },
  { month: 'ديسمبر', users: 140 },
];

const categoryDistribution = [
  { name: 'البناء', value: 35, color: '#1B3A5C' },
  { name: 'الإلكترونيات', value: 25, color: '#E8A838' },
  { name: 'الأغذية', value: 15, color: '#059669' },
  { name: 'المنسوجات', value: 10, color: '#7C3AED' },
  { name: 'التقنية', value: 8, color: '#DC2626' },
  { name: 'أخرى', value: 7, color: '#6B7280' },
];

export default function AdminReports() {
  const { profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('year');

  const isAdmin = !authLoading && profile?.role === 'admin';
  const loading = authLoading || !isAdmin;

  const summaryStats = [
    { label: 'إجمالي الإيرادات', value: '3,740,000 DA', change: 22.1, icon: DollarSign, color: 'bg-green-50 text-green-600' },
    { label: 'إجمالي الطلبات', value: '905', change: 15.3, icon: ShoppingCart, color: 'bg-blue-50 text-blue-600' },
    { label: 'المستخدمون الجدد', value: '1,003', change: 18.7, icon: Users, color: 'bg-purple-50 text-purple-600' },
    { label: 'متوسط قيمة الطلب', value: '4,133 DA', change: -3.2, icon: Package, color: 'bg-orange-50 text-orange-600' },
  ];

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-72" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#1B3A5C]" />
            التقارير والتحليلات
          </h1>
          <p className="text-sm text-gray-500">تحليلات مفصلة عن أداء المنصة</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <CalendarDays className="w-4 h-4 ml-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">هذا الأسبوع</SelectItem>
              <SelectItem value="month">هذا الشهر</SelectItem>
              <SelectItem value="quarter">هذا الربع</SelectItem>
              <SelectItem value="year">هذه السنة</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-1.5">
            <Download className="w-4 h-4" /> تصدير
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((s, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className={`w-9 h-9 rounded-lg ${s.color} flex items-center justify-center`}>
                  <s.icon className="w-4.5 h-4.5" />
                </div>
                <div className={`flex items-center gap-0.5 text-xs font-medium ${s.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {s.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(s.change)}%
                </div>
              </div>
              <p className="text-lg font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row 1: Revenue + Orders by Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#1B3A5C]" />
              الإيرادات عبر الزمن
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                    formatter={(value: number) => [formatPrice(value), 'الإيرادات']}
                  />
                  <Line type="monotone" dataKey="revenue" name="الإيرادات" stroke="#1B3A5C" strokeWidth={2.5} dot={{ r: 3, fill: '#1B3A5C' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-[#1B3A5C]" />
              الطلبات حسب الحالة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ordersByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {ordersByStatus.map((entry, index) => (
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
      </div>

      {/* Row 2: Top Suppliers + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#1B3A5C]" />
              أفضل 10 موردين حسب المبيعات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSuppliers} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10, fill: '#6b7280' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                    formatter={(value: number) => [formatPrice(value), 'المبيعات']}
                  />
                  <Bar dataKey="sales" name="المبيعات" fill="#1B3A5C" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Package className="w-4 h-4 text-[#1B3A5C]" />
              أفضل 10 منتجات حسب المبيعات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} margin={{ bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9ca3af', angle: -35, textAnchor: 'end' }} height={60} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                  <Bar dataKey="sales" name="المبيعات" fill="#E8A838" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: User Growth + Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#1B3A5C]" />
              نمو المستخدمين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                  <defs>
                    <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="users"
                    name="المستخدمون الجدد"
                    stroke="#7C3AED"
                    strokeWidth={2}
                    fill="url(#userGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Package className="w-4 h-4 text-[#1B3A5C]" />
              توزيع التصنيفات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} formatter={(value: number) => [`${value}%`, 'النسبة']} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700">ملخص الأداء</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="text-xs font-semibold">المؤشر</TableHead>
                  <TableHead className="text-xs font-semibold">هذا الشهر</TableHead>
                  <TableHead className="text-xs font-semibold">الشهر السابق</TableHead>
                  <TableHead className="text-xs font-semibold">التغيير</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { metric: 'إجمالي الإيرادات', current: '520,000 DA', previous: '475,000 DA', change: '+9.5%' },
                  { metric: 'عدد الطلبات', current: '135', previous: '120', change: '+12.5%' },
                  { metric: 'مستخدمون جدد', current: '140', previous: '125', change: '+12%' },
                  { metric: 'موردين جدد', current: '15', previous: '12', change: '+25%' },
                  { metric: 'منتجات جديدة', current: '85', previous: '72', change: '+18.1%' },
                  { metric: 'متوسط قيمة الطلب', current: '3,852 DA', previous: '3,958 DA', change: '-2.7%' },
                  { metric: 'معدل التحويل', current: '3.2%', previous: '2.9%', change: '+10.3%' },
                ].map((row, idx) => (
                  <TableRow key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                    <TableCell className="text-sm font-medium">{row.metric}</TableCell>
                    <TableCell className="text-sm">{row.current}</TableCell>
                    <TableCell className="text-sm text-gray-500">{row.previous}</TableCell>
                    <TableCell>
                      <span className={`text-sm font-medium ${row.change.startsWith('+') ? 'text-green-600' : 'text-red-500'}`}>
                        {row.change}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
