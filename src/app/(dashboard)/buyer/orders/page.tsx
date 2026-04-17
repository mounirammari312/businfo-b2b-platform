'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLocaleStore, useCurrencyStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { cn, formatRelativeTime } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Pagination } from '@/components/shared';
import {
  ShoppingCart,
  Eye,
  Package,
  Filter,
  Clock,
  CalendarDays,
  Building2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  currency: string;
  status: string;
  supplier_name: string;
  notes?: string;
  shipping_address?: string;
  items: OrderItem[];
}

const orderStatusConfig: Record<string, { ar: string; fr: string; color: string }> = {
  pending: { ar: 'قيد الانتظار', fr: 'En attente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  confirmed: { ar: 'مؤكد', fr: 'Confirme', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  shipped: { ar: 'تم الشحن', fr: 'Expédié', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  delivered: { ar: 'تم التوصيل', fr: 'Livré', color: 'bg-green-100 text-green-800 border-green-200' },
  cancelled: { ar: 'ملغي', fr: 'Annulé', color: 'bg-red-100 text-red-800 border-red-200' },
};

const ITEMS_PER_PAGE = 10;

export default function BuyerOrdersPage() {
  const { user } = useAuth();
  const { locale } = useLocaleStore();
  const { formatPrice: storeFormatPrice } = useCurrencyStore();
  const t = getTranslation(locale);

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  const totalPages = Math.ceil(totalOrders / ITEMS_PER_PAGE);

  const loadOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select('id, created_at, total_amount, currency, status, suppliers(name)', { count: 'exact' })
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) throw error;

      setOrders(
        (data || []).map((o) => ({
          id: o.id,
          created_at: o.created_at,
          total_amount: o.total_amount,
          currency: o.currency,
          status: o.status,
          supplier_name: (o.suppliers as unknown as { name: string })?.name || '',
        }))
      );
      setTotalOrders(count || 0);
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  }, [user, currentPage, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleViewOrder = async (order: Order) => {
    setSelectedOrder(order);
    setDetailLoading(true);
    try {
      const { data } = await supabase
        .from('order_items')
        .select('product_name, quantity, unit_price, total_price')
        .eq('order_id', order.id);

      setOrderItems(
        (data || []).map((item) => ({
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        }))
      );
    } catch (err) {
      console.error('Error loading order items:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const config = orderStatusConfig[status];
    return config ? config[locale] : status;
  };

  const getStatusColor = (status: string) => {
    return orderStatusConfig[status]?.color || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const statusFilters = [
    { value: 'all', label: locale === 'ar' ? 'الكل' : 'Tous' },
    { value: 'pending', label: locale === 'ar' ? 'قيد الانتظار' : 'En attente' },
    { value: 'confirmed', label: locale === 'ar' ? 'مؤكد' : 'Confirme' },
    { value: 'shipped', label: locale === 'ar' ? 'تم الشحن' : 'Expédié' },
    { value: 'delivered', label: locale === 'ar' ? 'تم التوصيل' : 'Livré' },
    { value: 'cancelled', label: locale === 'ar' ? 'ملغي' : 'Annulé' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            {locale === 'ar' ? 'طلباتي' : 'Mes commandes'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {locale === 'ar'
              ? `إجمالي ${totalOrders} طلب`
              : `${totalOrders} commande(s) au total`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusFilters.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="text-xs font-semibold">
                  {locale === 'ar' ? 'رقم الطلب' : 'N° Commande'}
                </TableHead>
                <TableHead className="text-xs font-semibold">
                  {locale === 'ar' ? 'التاريخ' : 'Date'}
                </TableHead>
                <TableHead className="text-xs font-semibold hidden sm:table-cell">
                  {locale === 'ar' ? 'المورد' : 'Fournisseur'}
                </TableHead>
                <TableHead className="text-xs font-semibold">
                  {locale === 'ar' ? 'المبلغ' : 'Montant'}
                </TableHead>
                <TableHead className="text-xs font-semibold">
                  {locale === 'ar' ? 'الحالة' : 'Statut'}
                </TableHead>
                <TableHead className="text-xs font-semibold text-end">
                  {locale === 'ar' ? 'إجراءات' : 'Actions'}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 rounded-lg ms-auto" /></TableCell>
                  </TableRow>
                ))
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="flex flex-col items-center justify-center py-16">
                      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                        <ShoppingCart className="w-8 h-8 text-muted-foreground/40" />
                      </div>
                      <p className="text-sm font-medium text-foreground mb-1">
                        {locale === 'ar' ? 'لا توجد طلبات' : 'Aucune commande'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {locale === 'ar'
                          ? 'لم تقم بأي طلبات بعد'
                          : "Vous n'avez pas encore passe de commande"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-sm font-medium text-navy">
                      #{order.id.slice(0, 8)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatRelativeTime(order.created_at, locale)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm">{order.supplier_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-semibold">
                      {storeFormatPrice(order.total_amount)}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('text-[11px] px-2.5 py-0.5 border font-medium', getStatusColor(order.status))}>
                        {getStatusLabel(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleViewOrder(order)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {!loading && orders.length > 0 && totalPages > 1 && (
          <div className="px-4 py-3 border-t border-border">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-navy" />
              {locale === 'ar' ? 'تفاصيل الطلب' : 'Details de la commande'} #{selectedOrder?.id.slice(0, 8)}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4 pb-4">
                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      {locale === 'ar' ? 'التاريخ' : 'Date'}
                    </p>
                    <p className="text-sm font-medium">
                      {new Date(selectedOrder.created_at).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'fr-DZ')}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {locale === 'ar' ? 'الحالة' : 'Statut'}
                    </p>
                    <Badge className={cn('text-[11px] px-2.5 py-0.5 border font-medium', getStatusColor(selectedOrder.status))}>
                      {getStatusLabel(selectedOrder.status)}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {locale === 'ar' ? 'المورد' : 'Fournisseur'}
                    </p>
                    <p className="text-sm font-medium">{selectedOrder.supplier_name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">{locale === 'ar' ? 'المبلغ الإجمالي' : 'Total'}</p>
                    <p className="text-lg font-bold text-navy">{storeFormatPrice(selectedOrder.total_amount)}</p>
                  </div>
                </div>

                {selectedOrder.shipping_address && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">{locale === 'ar' ? 'عنوان الشحن' : 'Adresse de livraison'}</p>
                    <p className="text-sm">{selectedOrder.shipping_address}</p>
                  </div>
                )}

                {selectedOrder.notes && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">{locale === 'ar' ? 'ملاحظات' : 'Notes'}</p>
                    <p className="text-sm">{selectedOrder.notes}</p>
                  </div>
                )}

                <Separator />

                {/* Items */}
                <div>
                  <p className="text-sm font-semibold mb-3">
                    {locale === 'ar' ? 'عناصر الطلب' : 'Articles'}
                  </p>
                  {detailLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full rounded-lg" />
                      ))}
                    </div>
                  ) : orderItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {locale === 'ar' ? 'لا توجد عناصر' : 'Aucun article'}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {orderItems.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-navy/5 flex items-center justify-center shrink-0">
                              <Package className="w-4 h-4 text-navy" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{item.product_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.quantity} x {storeFormatPrice(item.unit_price)}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm font-semibold shrink-0 ms-4">
                            {storeFormatPrice(item.total_price)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
