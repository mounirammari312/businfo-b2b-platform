'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLocaleStore } from '@/lib/store';
import { formatPrice, formatDate, cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
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
import { Pagination } from '@/components/shared/Pagination';
import { toast } from 'sonner';
import {
  ShoppingCart,
  Eye,
  Package,
  Filter,
} from 'lucide-react';

interface Order {
  id: string;
  buyer_name: string;
  total_amount: number;
  currency: string;
  status: string;
  created_at: string;
  shipping_address: string;
  notes: string;
  items: OrderItem[];
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

const ITEMS_PER_PAGE = 10;

const statusConfig: Record<string, { ar: string; en: string; color: string }> = {
  pending: { ar: 'قيد الانتظار', en: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { ar: 'مؤكد', en: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
  shipped: { ar: 'تم الشحن', en: 'Shipped', color: 'bg-purple-100 text-purple-800' },
  delivered: { ar: 'تم التسليم', en: 'Delivered', color: 'bg-green-100 text-green-800' },
  cancelled: { ar: 'ملغي', en: 'Cancelled', color: 'bg-red-100 text-red-800' },
};

export default function ManageOrders() {
  const { locale } = useLocaleStore();
  const { supplier } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadOrders = useCallback(async () => {
    if (!supplier?.id) return;
    setLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select('*, profiles!orders_buyer_id_fkey(display_name)')
        .eq('supplier_id', supplier.id)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      setOrders((data || []).map(o => ({
        id: o.id,
        buyer_name: (o.profiles as Record<string, string>)?.display_name || '—',
        total_amount: Number(o.total_amount) || 0,
        currency: o.currency || 'DZD',
        status: o.status,
        created_at: o.created_at,
        shipping_address: o.shipping_address || '',
        notes: o.notes || '',
        items: [],
      })));
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  }, [supplier?.id, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filteredOrders = orders;
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleViewOrder = async (order: Order) => {
    setSelectedOrder(order);
    setLoadingDetail(true);
    try {
      const { data } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id);

      setOrderItems((data || []).map(item => ({
        id: item.id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        total_price: Number(item.total_price),
      })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
      toast.success(locale === 'ar' ? 'تم تحديث حالة الطلب' : 'Order status updated');
      loadOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch {
      toast.error(locale === 'ar' ? 'فشل تحديث الحالة' : 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const nextStatus = (current: string): string | null => {
    const flow: Record<string, string> = { pending: 'confirmed', confirmed: 'shipped', shipped: 'delivered' };
    return flow[current] || null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{locale === 'ar' ? 'إدارة الطلبات' : 'Manage Orders'}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {locale === 'ar' ? `${orders.length} طلب` : `${orders.length} orders`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 me-2" />
                <SelectValue placeholder={locale === 'ar' ? 'تصفية حسب الحالة' : 'Filter by status'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{locale === 'ar' ? 'جميع الحالات' : 'All Status'}</SelectItem>
                <SelectItem value="pending">{locale === 'ar' ? 'قيد الانتظار' : 'Pending'}</SelectItem>
                <SelectItem value="confirmed">{locale === 'ar' ? 'مؤكد' : 'Confirmed'}</SelectItem>
                <SelectItem value="shipped">{locale === 'ar' ? 'تم الشحن' : 'Shipped'}</SelectItem>
                <SelectItem value="delivered">{locale === 'ar' ? 'تم التسليم' : 'Delivered'}</SelectItem>
                <SelectItem value="cancelled">{locale === 'ar' ? 'ملغي' : 'Cancelled'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : paginatedOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <ShoppingCart className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg">{locale === 'ar' ? 'لا توجد طلبات' : 'No orders found'}</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {locale === 'ar' ? 'ستظهر الطلبات هنا عندما يقوم المشترون بطلب منتجاتك' : 'Orders will appear here when buyers order your products'}
              </p>
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
                    <TableHead className="text-end">{locale === 'ar' ? 'إجراءات' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">#{order.id.slice(0, 8)}</TableCell>
                      <TableCell className="text-sm font-medium">{order.buyer_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(order.created_at, locale)}</TableCell>
                      <TableCell className="text-sm font-semibold">{formatPrice(order.total_amount, order.currency)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', statusConfig[order.status]?.color)}>
                            {statusConfig[order.status]?.[locale === 'ar' ? 'ar' : 'en'] || order.status}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-end">
                        <div className="flex items-center justify-end gap-2">
                          {nextStatus(order.status) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(order.id, nextStatus(order.status)!)}
                              disabled={updatingStatus}
                            >
                              {locale === 'ar' ? 'تحديث' : 'Update'}
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => handleViewOrder(order)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {locale === 'ar' ? 'تفاصيل الطلب' : 'Order Details'} #{selectedOrder?.id.slice(0, 8)}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">{locale === 'ar' ? 'المشتري' : 'Buyer'}</p>
                  <p className="font-medium">{selectedOrder.buyer_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{locale === 'ar' ? 'التاريخ' : 'Date'}</p>
                  <p className="font-medium">{formatDate(selectedOrder.created_at, locale)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{locale === 'ar' ? 'الحالة' : 'Status'}</p>
                  <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', statusConfig[selectedOrder.status]?.color)}>
                    {statusConfig[selectedOrder.status]?.[locale === 'ar' ? 'ar' : 'en'] || selectedOrder.status}
                  </span>
                </div>
                <div>
                  <p className="text-muted-foreground">{locale === 'ar' ? 'الإجمالي' : 'Total'}</p>
                  <p className="font-bold text-navy">{formatPrice(selectedOrder.total_amount, selectedOrder.currency)}</p>
                </div>
              </div>

              {selectedOrder.shipping_address && (
                <div className="text-sm">
                  <p className="text-muted-foreground">{locale === 'ar' ? 'عنوان الشحن' : 'Shipping Address'}</p>
                  <p>{selectedOrder.shipping_address}</p>
                </div>
              )}

              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-4 py-2">
                  <p className="font-semibold text-sm">{locale === 'ar' ? 'عناصر الطلب' : 'Order Items'}</p>
                </div>
                {loadingDetail ? (
                  <div className="p-4 space-y-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
                ) : orderItems.length > 0 ? (
                  <div className="divide-y">
                    {orderItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                            <Package className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{item.product_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatPrice(item.unit_price, selectedOrder.currency)} x {item.quantity}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-semibold">{formatPrice(item.total_price, selectedOrder.currency)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    {locale === 'ar' ? 'لا توجد عناصر' : 'No items'}
                  </div>
                )}
              </div>

              {nextStatus(selectedOrder.status) && (
                <Button
                  className="w-full bg-navy hover:bg-navy-light text-white"
                  onClick={() => handleStatusChange(selectedOrder.id, nextStatus(selectedOrder.status)!)}
                  disabled={updatingStatus}
                >
                  {locale === 'ar'
                    ? `تحديث إلى: ${statusConfig[nextStatus(selectedOrder.status)!]?.ar}`
                    : `Update to: ${statusConfig[nextStatus(selectedOrder.status)!]?.en}`}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
