'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getAllProducts, updateProduct, deleteProduct } from '@/lib/db';
import { formatDate, formatPrice } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search, Eye, Ban, CheckCircle, Trash2, MoreHorizontal, Package,
  ChevronLeft, ChevronRight, Star, ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ProductData {
  id: string;
  supplierId: string;
  supplierName: string;
  name: string;
  nameEn?: string;
  price: number;
  currency: string;
  imageUrl?: string;
  category?: string;
  inStock: boolean;
  stockQuantity?: number;
  unit: string;
  minOrder: number;
  status: string;
  isFeatured?: boolean;
  createdAt: string;
}

const ITEMS_PER_PAGE = 10;

export default function AdminProducts() {
  const { profile, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllProducts() as unknown as ProductData[];
      setProducts(data);
    } catch {
      setProducts([]);
    }
    setLoading(false);
  }, []);

  const isAdmin = !authLoading && profile?.role === 'admin';
  const hasFetched = React.useRef(false);
  React.useEffect(() => {
    if (isAdmin && !hasFetched.current) {
      hasFetched.current = true;
      loadProducts();
    }
  }, [isAdmin, loadProducts]);

  const loading = authLoading;

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.supplierName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchSearch && matchStatus && matchCategory;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'archived' : 'active';
    await updateProduct(id, { inStock: newStatus === 'active' });
    toast.success(newStatus === 'active' ? 'تم تفعيل المنتج' : 'تم إلغاء تفعيل المنتج');
    loadProducts();
  };

  const handleToggleFeatured = async (id: string, currentFeatured: boolean) => {
    await updateProduct(id, { inStock: !currentFeatured });
    toast.success(!currentFeatured ? 'تم تمييز المنتج' : 'تم إزالة التمييز');
    loadProducts();
  };

  const handleDelete = async (id: string) => {
    await deleteProduct(id);
    toast.success('تم حذف المنتج بنجاح');
    setDeleteDialog(null);
    loadProducts();
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Card><CardContent className="p-0">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full border-b" />)}</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Package className="w-5 h-5 text-[#1B3A5C]" />
          إدارة المنتجات
        </h1>
        <p className="text-sm text-gray-500">{filtered.length} منتج</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="بحث بالاسم أو المورد..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pr-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="draft">مسودة</SelectItem>
                <SelectItem value="archived">مؤرشف</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="التصنيف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع التصنيفات</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c} value={c || ''}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="text-xs font-semibold">المنتج</TableHead>
                  <TableHead className="text-xs font-semibold">المورد</TableHead>
                  <TableHead className="text-xs font-semibold">السعر</TableHead>
                  <TableHead className="text-xs font-semibold">المخزون</TableHead>
                  <TableHead className="text-xs font-semibold">الحالة</TableHead>
                  <TableHead className="text-xs font-semibold text-start">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                      <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">لا يوجد منتجات</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((p, idx) => (
                    <TableRow key={p.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                              <ImageIcon className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate max-w-48">{p.name}</p>
                            {p.isFeatured && (
                              <Badge className="text-[10px] px-1.5 py-0 bg-[#E8A838] text-white">مميز</Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600 truncate max-w-32 block">{p.supplierName}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-gray-900">{formatPrice(p.price, p.currency || 'DZD')}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${p.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {p.inStock ? (p.stockQuantity ? `${p.stockQuantity} قطعة` : 'متوفر') : 'غير متوفر'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${
                          p.status === 'active' ? 'bg-green-100 text-green-700' :
                          p.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {p.status === 'active' ? 'نشط' : p.status === 'draft' ? 'مسودة' : 'مؤرشف'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4 text-gray-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={() => handleToggleStatus(p.id, p.status)}>
                              {p.status === 'active' ? (
                                <><Ban className="w-4 h-4 ml-2" /> إلغاء التفعيل</>
                              ) : (
                                <><CheckCircle className="w-4 h-4 ml-2" /> تفعيل</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => setDeleteDialog(p.id)}>
                              <Trash2 className="w-4 h-4 ml-2" /> حذف
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            عرض {(page - 1) * ITEMS_PER_PAGE + 1} إلى {Math.min(page * ITEMS_PER_PAGE, filtered.length)} من {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
              <Button key={i + 1} variant={page === i + 1 ? 'default' : 'outline'} size="sm" className="w-8 h-8 p-0" onClick={() => setPage(i + 1)}>
                {i + 1}
              </Button>
            ))}
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
            <AlertDialogDescription>سيتم حذف المنتج نهائياً.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteDialog && handleDelete(deleteDialog)}>
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
