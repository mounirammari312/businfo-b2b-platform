'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLocaleStore } from '@/lib/store';
import { formatPrice, formatDate, cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Pagination } from '@/components/shared/Pagination';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  PackageOpen,
  Filter,
  ImageIcon,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  name_en: string;
  price: number;
  currency: string;
  status: string;
  stock_quantity: number | null;
  in_stock: boolean;
  unit: string;
  category_id: string | null;
  created_at: string;
  primary_image?: string;
  category_name?: string;
}

const ITEMS_PER_PAGE = 10;

export default function ManageProducts() {
  const { locale } = useLocaleStore();
  const { supplier } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState<{ id: string; name: string; name_en: string }[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadProducts = useCallback(async () => {
    if (!supplier?.id) return;
    setLoading(true);
    try {
      let query = supabase
        .from('products')
        .select('*, categories(name, name_en), product_images(url, is_primary)')
        .eq('supplier_id', supplier.id)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (categoryFilter !== 'all') {
        query = query.eq('category_id', categoryFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      const mapped = (data || []).map((p: Record<string, unknown>) => {
        const images = p.product_images as Record<string, unknown>[] || [];
        const primaryImage = images.find((img: Record<string, unknown>) => img.is_primary)?.url || images[0]?.url || '';
        const cat = p.categories as Record<string, string> | null;
        return {
          id: p.id,
          name: p.name,
          name_en: p.name_en || '',
          price: Number(p.price),
          currency: p.currency,
          status: p.status,
          stock_quantity: p.stock_quantity,
          in_stock: p.in_stock,
          unit: p.unit,
          category_id: p.category_id,
          created_at: p.created_at,
          primary_image: primaryImage,
          category_name: locale === 'ar' ? cat?.name : cat?.name_en,
        };
      });

      setProducts(mapped);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  }, [supplier?.id, statusFilter, categoryFilter, locale]);

  const loadCategories = async () => {
    const { data } = await supabase.from('categories').select('id, name, name_en').eq('is_active', true);
    setCategories((data || []).map(c => ({ id: c.id, name: c.name, name_en: c.name_en })));
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filteredProducts = products.filter(p => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return p.name.toLowerCase().includes(s) || (p.name_en && p.name_en.toLowerCase().includes(s));
  });

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleToggleStatus = async (product: Product) => {
    const newStatus = product.status === 'active' ? 'draft' : 'active';
    try {
      const { error } = await supabase
        .from('products')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', product.id);

      if (error) throw error;
      toast.success(locale === 'ar' ? 'تم تحديث حالة المنتج' : 'Product status updated');
      loadProducts();
    } catch {
      toast.error(locale === 'ar' ? 'فشل تحديث الحالة' : 'Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('products').delete().eq('id', deleteDialog);
      if (error) throw error;
      toast.success(locale === 'ar' ? 'تم حذف المنتج' : 'Product deleted');
      setDeleteDialog(null);
      loadProducts();
    } catch {
      toast.error(locale === 'ar' ? 'فشل حذف المنتج' : 'Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  const statusBadge: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    draft: 'bg-gray-100 text-gray-600',
    archived: 'bg-red-100 text-red-800',
  };
  const statusLabel: Record<string, { ar: string; en: string }> = {
    active: { ar: 'نشط', en: 'Active' },
    draft: { ar: 'مسودة', en: 'Draft' },
    archived: { ar: 'مؤرشف', en: 'Archived' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{locale === 'ar' ? 'إدارة المنتجات' : 'Manage Products'}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {locale === 'ar' ? `${products.length} منتج` : `${products.length} products`}
          </p>
        </div>
        <Button asChild className="bg-navy hover:bg-navy-light text-white">
          <Link href="/supplier/products/new">
            <Plus className="w-4 h-4 me-2" />
            {locale === 'ar' ? 'إضافة منتج' : 'Add Product'}
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={locale === 'ar' ? 'ابحث عن منتج...' : 'Search products...'}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="ps-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder={locale === 'ar' ? 'الحالة' : 'Status'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{locale === 'ar' ? 'الكل' : 'All'}</SelectItem>
                <SelectItem value="active">{locale === 'ar' ? 'نشط' : 'Active'}</SelectItem>
                <SelectItem value="draft">{locale === 'ar' ? 'مسودة' : 'Draft'}</SelectItem>
                <SelectItem value="archived">{locale === 'ar' ? 'مؤرشف' : 'Archived'}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder={locale === 'ar' ? 'التصنيف' : 'Category'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{locale === 'ar' ? 'الكل' : 'All'}</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{locale === 'ar' ? c.name : c.name_en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : paginatedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <PackageOpen className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg">{locale === 'ar' ? 'لا توجد منتجات' : 'No products found'}</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {locale === 'ar' ? 'ابدأ بإضافة منتجاتك الأولى' : 'Start by adding your first products'}
              </p>
              <Button asChild className="bg-navy hover:bg-navy-light text-white mt-4">
                <Link href="/supplier/products/new">
                  <Plus className="w-4 h-4 me-2" />
                  {locale === 'ar' ? 'إضافة منتج' : 'Add Product'}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{locale === 'ar' ? 'الصورة' : 'Image'}</TableHead>
                    <TableHead>{locale === 'ar' ? 'المنتج' : 'Product'}</TableHead>
                    <TableHead>{locale === 'ar' ? 'التصنيف' : 'Category'}</TableHead>
                    <TableHead>{locale === 'ar' ? 'السعر' : 'Price'}</TableHead>
                    <TableHead>{locale === 'ar' ? 'المخزون' : 'Stock'}</TableHead>
                    <TableHead>{locale === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                    <TableHead className="text-end">{locale === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden">
                          {product.primary_image ? (
                            <Image
                              src={product.primary_image}
                              alt={product.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.name_en}</p>
                      </TableCell>
                      <TableCell className="text-sm">{product.category_name || '—'}</TableCell>
                      <TableCell className="text-sm font-semibold">{formatPrice(product.price, product.currency)}</TableCell>
                      <TableCell className="text-sm">
                        {product.stock_quantity !== null ? product.stock_quantity : (product.in_stock ? (locale === 'ar' ? 'متوفر' : 'In Stock') : (locale === 'ar' ? 'غير متوفر' : 'Out of Stock'))}
                      </TableCell>
                      <TableCell>
                        <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', statusBadge[product.status])}>
                          {(statusLabel[product.status]?.[locale === 'ar' ? 'ar' : 'en']) || product.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/supplier/products/${product.id}/edit`} className="flex items-center gap-2 cursor-pointer">
                                <Pencil className="w-4 h-4" />
                                {locale === 'ar' ? 'تعديل' : 'Edit'}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(product)} className="flex items-center gap-2 cursor-pointer">
                              {product.status === 'active' ? (
                                <>
                                  <EyeOff className="w-4 h-4" />
                                  {locale === 'ar' ? 'إلغاء النشر' : 'Unpublish'}
                                </>
                              ) : (
                                <>
                                  <Eye className="w-4 h-4" />
                                  {locale === 'ar' ? 'نشر' : 'Publish'}
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteDialog(product.id)}
                              className="flex items-center gap-2 cursor-pointer text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                              {locale === 'ar' ? 'حذف' : 'Delete'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      )}

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{locale === 'ar' ? 'حذف المنتج' : 'Delete Product'}</AlertDialogTitle>
            <AlertDialogDescription>
              {locale === 'ar' ? 'هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to delete this product? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{locale === 'ar' ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white">
              {deleting ? (locale === 'ar' ? 'جارٍ الحذف...' : 'Deleting...') : (locale === 'ar' ? 'حذف' : 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
