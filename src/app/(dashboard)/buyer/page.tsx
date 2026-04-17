'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useLocaleStore, useCurrencyStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { cn, formatRelativeTime, formatNumber } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShoppingCart,
  FileText,
  Heart,
  MessageCircle,
  ArrowLeft,
  ArrowRight,
  Plus,
  Clock,
  Package,
  TrendingUp,
  Eye,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface DashboardStats {
  totalOrders: number;
  pendingQuotes: number;
  favoritesCount: number;
  unreadMessages: number;
}

interface RecentOrder {
  id: string;
  created_at: string;
  total_amount: number;
  currency: string;
  status: string;
  supplier_name?: string;
}

interface RecentQuote {
  id: string;
  title: string;
  status: string;
  created_at: string;
  replies_count?: number;
}

const orderStatusConfig: Record<string, { ar: string; fr: string; color: string }> = {
  pending: { ar: 'قيد الانتظار', fr: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { ar: 'مؤكد', fr: 'Confirme', color: 'bg-blue-100 text-blue-800' },
  shipped: { ar: 'تم الشحن', fr: 'Expédié', color: 'bg-purple-100 text-purple-800' },
  delivered: { ar: 'تم التوصيل', fr: 'Livré', color: 'bg-green-100 text-green-800' },
  cancelled: { ar: 'ملغي', fr: 'Annulé', color: 'bg-red-100 text-red-800' },
};

const quoteStatusConfig: Record<string, { ar: string; fr: string; color: string }> = {
  open: { ar: 'مفتوح', fr: 'Ouvert', color: 'bg-blue-100 text-blue-800' },
  replied: { ar: 'تم الرد', fr: 'Répondu', color: 'bg-green-100 text-green-800' },
  closed: { ar: 'مغلق', fr: 'Fermé', color: 'bg-gray-100 text-gray-800' },
  expired: { ar: 'منتهي', fr: 'Expiré', color: 'bg-red-100 text-red-800' },
};

export default function BuyerOverviewPage() {
  const { user, profile } = useAuth();
  const { locale } = useLocaleStore();
  const { formatPrice: storeFormatPrice } = useCurrencyStore();
  const t = getTranslation(locale);
  const isRtl = locale === 'ar';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingQuotes: 0,
    favoritesCount: 0,
    unreadMessages: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentQuotes, setRecentQuotes] = useState<RecentQuote[]>([]);

  useEffect(() => {
    if (!user) return;
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch stats in parallel
      const [ordersRes, quotesRes, favsRes, msgsRes, recentOrdersRes, recentQuotesRes] = await Promise.all([
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('buyer_id', user.id),
        supabase.from('quotes').select('id', { count: 'exact', head: true }).eq('buyer_id', user.id).eq('status', 'open'),
        supabase.from('favorites').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('messages').select('id', { count: 'exact', head: true }).eq('to_user_id', user.id).eq('is_read', false),
        supabase.from('orders').select('id, created_at, total_amount, currency, status, suppliers(name)').eq('buyer_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('quotes').select('id, title, status, created_at').eq('buyer_id', user.id).order('created_at', { ascending: false }).limit(5),
      ]);

      setStats({
        totalOrders: ordersRes.count || 0,
        pendingQuotes: quotesRes.count || 0,
        favoritesCount: favsRes.count || 0,
        unreadMessages: msgsRes.count || 0,
      });

      setRecentOrders(
        (recentOrdersRes.data || []).map((o) => ({
          id: o.id,
          created_at: o.created_at,
          total_amount: o.total_amount,
          currency: o.currency,
          status: o.status,
          supplier_name: (o.suppliers as unknown as { name: string })?.name || '',
        }))
      );

      setRecentQuotes(
        (recentQuotesRes.data || []).map((q) => ({
          id: q.id,
          title: q.title,
          status: q.status,
          created_at: q.created_at,
        }))
      );
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: locale === 'ar' ? 'إجمالي الطلبات' : 'Total commandes',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'bg-blue-50 text-blue-600',
      iconBg: 'bg-blue-100',
    },
    {
      label: locale === 'ar' ? 'عروض أسعار مفتوحة' : 'Devis ouverts',
      value: stats.pendingQuotes,
      icon: FileText,
      color: 'bg-green-50 text-green-600',
      iconBg: 'bg-green-100',
    },
    {
      label: locale === 'ar' ? 'المفضلة' : 'Favoris',
      value: stats.favoritesCount,
      icon: Heart,
      color: 'bg-red-50 text-red-600',
      iconBg: 'bg-red-100',
    },
    {
      label: locale === 'ar' ? 'رسائل غير مقروءة' : 'Messages non lus',
      value: stats.unreadMessages,
      icon: MessageCircle,
      color: 'bg-purple-50 text-purple-600',
      iconBg: 'bg-purple-100',
    },
  ];

  const quickActions = [
    {
      label: locale === 'ar' ? 'تصفح المنتجات' : 'Parcourir les produits',
      href: '/products',
      icon: Package,
    },
    {
      label: locale === 'ar' ? 'طلب عرض سعر' : 'Demander un devis',
      href: '/buyer/quotes',
      icon: FileText,
    },
    {
      label: locale === 'ar' ? 'الموردين' : 'Fournisseurs',
      href: '/suppliers',
      icon: TrendingUp,
    },
    {
      label: locale === 'ar' ? 'مقارنة المنتجات' : 'Comparer des produits',
      href: '/compare',
      icon: Eye,
    },
  ];

  const getOrderStatusLabel = (status: string) => {
    const config = orderStatusConfig[status];
    return config ? config[locale] : status;
  };

  const getOrderStatusColor = (status: string) => {
    return orderStatusConfig[status]?.color || 'bg-gray-100 text-gray-800';
  };

  const getQuoteStatusLabel = (status: string) => {
    const config = quoteStatusConfig[status];
    return config ? config[locale] : status;
  };

  const getQuoteStatusColor = (status: string) => {
    return quoteStatusConfig[status]?.color || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="gradient-navy-soft rounded-2xl p-6 sm:p-8 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">
              {locale === 'ar' ? `مرحباً، ${profile?.displayName || ''}` : `Bonjour, ${profile?.displayName || ''}`}
            </h1>
            <p className="text-white/70 text-sm sm:text-base">
              {locale === 'ar'
                ? 'مرحبا بك في لوحة تحكمك. إليك ملخص نشاطك الأخير.'
                : 'Bienvenue dans votre tableau de bord. Voici un resume de votre activite recente.'}
            </p>
          </div>
          <Button className="bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-xl shrink-0">
            <Plus className="w-4 h-4 me-2" />
            {locale === 'ar' ? 'طلب عرض سعر جديد' : 'Nouveau devis'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-border">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <Skeleton className="w-8 h-8 rounded-full" />
                  </div>
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))
          : statCards.map((stat, i) => (
              <Card key={i} className="border-border hover:shadow-[var(--shadow-md)] transition-shadow">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', stat.iconBg)}>
                      <stat.icon className={cn('w-5 h-5', stat.color.split(' ')[1])} />
                    </div>
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', stat.color.split(' ')[0])}>
                      <TrendingUp className={cn('w-4 h-4', stat.color.split(' ')[1])} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{formatNumber(stat.value, locale)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map((action, i) => (
          <Button
            key={i}
            asChild
            variant="outline"
            className="h-auto py-4 px-4 flex flex-col items-center gap-2.5 rounded-xl border-border hover:border-navy/20 hover:bg-navy/5 transition-all group"
          >
            <Link href={action.href}>
              <div className="w-10 h-10 rounded-lg bg-navy/5 flex items-center justify-center group-hover:bg-navy/10 transition-colors">
                <action.icon className="w-5 h-5 text-navy" />
              </div>
              <span className="text-xs font-medium text-foreground">{action.label}</span>
            </Link>
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-navy" />
              {locale === 'ar' ? 'أحدث الطلبات' : 'Commandes recentes'}
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-navy text-xs">
              <Link href="/buyer/orders" className="flex items-center gap-1">
                {locale === 'ar' ? 'عرض الكل' : 'Voir tout'}
                <ArrowIcon className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-9 h-9 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {locale === 'ar' ? 'لا توجد طلبات بعد' : 'Aucune commande'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href="/buyer/orders"
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-navy/5 flex items-center justify-center shrink-0">
                      <Package className="w-4 h-4 text-navy" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.supplier_name} · {formatRelativeTime(order.created_at, locale)}
                      </p>
                    </div>
                    <div className="text-end shrink-0">
                      <p className="text-sm font-semibold text-foreground">
                        {storeFormatPrice(order.total_amount)}
                      </p>
                      <Badge
                        className={cn(
                          'text-[10px] px-2 py-0 border-0 font-medium',
                          getOrderStatusColor(order.status)
                        )}
                      >
                        {getOrderStatusLabel(order.status)}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Quote Requests */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-navy" />
              {locale === 'ar' ? 'أحدث طلبات عروض الأسعار' : 'Demandes de devis recentes'}
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-navy text-xs">
              <Link href="/buyer/quotes" className="flex items-center gap-1">
                {locale === 'ar' ? 'عرض الكل' : 'Voir tout'}
                <ArrowIcon className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-9 h-9 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-40 mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            ) : recentQuotes.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {locale === 'ar' ? 'لا توجد طلبات عروض أسعار بعد' : 'Aucune demande de devis'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {recentQuotes.map((quote) => (
                  <Link
                    key={quote.id}
                    href="/buyer/quotes"
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{quote.title}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(quote.created_at, locale)}
                      </p>
                    </div>
                    <Badge
                      className={cn(
                        'text-[10px] px-2 py-0 border-0 font-medium',
                        getQuoteStatusColor(quote.status)
                      )}
                    >
                      {getQuoteStatusLabel(quote.status)}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
