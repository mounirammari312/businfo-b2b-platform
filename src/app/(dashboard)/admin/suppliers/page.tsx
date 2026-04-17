'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getAllSuppliers, updateSupplier, deleteSupplier } from '@/lib/db';
import { formatDate, formatNumber } from '@/lib/utils';
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Search, Eye, Ban, CheckCircle, Trash2, MoreHorizontal, Building2,
  Star, ChevronLeft, ChevronRight, Filter, MapPin, Phone, Globe,
  ShieldCheck, Package,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CATEGORIES } from '@/lib/constants';

interface SupplierData {
  id: string;
  userId: string;
  name: string;
  nameEn?: string;
  description?: string;
  category?: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
  address?: string;
  rating: number;
  reviewCount: number;
  views: number;
  productCount: number;
  badge: string;
  status: string;
  isVerified: boolean;
  joinedDate: string;
  createdAt?: string;
}

const ITEMS_PER_PAGE = 10;

export default function AdminSuppliers() {
  const { profile, loading: authLoading } = useAuth();
  const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verifiedFilter, setVerifiedFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierData | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);

  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllSuppliers() as unknown as SupplierData[];
      setSuppliers(data);
    } catch {
      setSuppliers([]);
    }
    setLoading(false);
  }, []);

  const isAdmin = !authLoading && profile?.role === 'admin';
  const hasFetched = React.useRef(false);
  React.useEffect(() => {
    if (isAdmin && !hasFetched.current) {
      hasFetched.current = true;
      loadSuppliers();
    }
  }, [isAdmin, loadSuppliers]);

  const loading = authLoading;

  const filtered = suppliers.filter((s) => {
    const matchSearch =
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.nameEn?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'all' || s.category === categoryFilter;
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchVerified = verifiedFilter === 'all' ||
      (verifiedFilter === 'yes' && s.isVerified) ||
      (verifiedFilter === 'no' && !s.isVerified);
    return matchSearch && matchCategory && matchStatus && matchVerified;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const stats = {
    total: suppliers.length,
    active: suppliers.filter(s => s.status === 'active').length,
    suspended: suppliers.filter(s => s.status === 'suspended').length,
    pending: suppliers.filter(s => s.status === 'pending').length,
  };

  const handleToggleStatus = async (id: string, userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    await updateSupplier(id, { status: newStatus as 'active' | 'suspended' });
    toast.success(newStatus === 'active' ? 'تم تفعيل المورد' : 'تم تعليق المورد');
    loadSuppliers();
  };

  const handleVerify = async (id: string) => {
    await updateSupplier(id, { isVerified: true });
    toast.success('تم توثيق المورد بنجاح');
    loadSuppliers();
  };

  const handleDelete = async (id: string) => {
    await deleteSupplier(id);
    toast.success('تم حذف المورد بنجاح');
    setDeleteDialog(null);
    setSelectedSupplier(null);
    loadSuppliers();
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Card><CardContent className="p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 mb-2" />)}</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#1B3A5C]" />
          إدارة الموردين
        </h1>
        <p className="text-sm text-gray-500">{filtered.length} مورد</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي الموردين', value: stats.total, icon: Building2, color: 'bg-blue-50 text-blue-600' },
          { label: 'نشط', value: stats.active, icon: CheckCircle, color: 'bg-green-50 text-green-600' },
          { label: 'معلق', value: stats.suspended, icon: Ban, color: 'bg-red-50 text-red-600' },
          { label: 'بانتظار المراجعة', value: stats.pending, icon: Star, color: 'bg-yellow-50 text-yellow-600' },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center shrink-0`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{formatNumber(s.value)}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="بحث بالاسم..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pr-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="التصنيف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع التصنيفات</SelectItem>
                {CATEGORIES.filter(c => c.key !== 'all').map(c => (
                  <SelectItem key={c.key} value={c.key}>{c.labelAr}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="suspended">معلق</SelectItem>
                <SelectItem value="pending">معلق</SelectItem>
              </SelectContent>
            </Select>
            <Select value={verifiedFilter} onValueChange={(v) => { setVerifiedFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="التوثيق" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="yes">موثق</SelectItem>
                <SelectItem value="no">غير موثق</SelectItem>
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
                  <TableHead className="text-xs font-semibold">المورد</TableHead>
                  <TableHead className="text-xs font-semibold">التصنيف</TableHead>
                  <TableHead className="text-xs font-semibold">المنتجات</TableHead>
                  <TableHead className="text-xs font-semibold">التقييم</TableHead>
                  <TableHead className="text-xs font-semibold">الحالة</TableHead>
                  <TableHead className="text-xs font-semibold">الانضمام</TableHead>
                  <TableHead className="text-xs font-semibold text-start">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                      <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">لا يوجد موردين</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((s, idx) => (
                    <TableRow key={s.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                            {s.logoUrl ? (
                              <img src={s.logoUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                              <Building2 className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate max-w-40">{s.name}</p>
                            <div className="flex items-center gap-1">
                              {s.isVerified && <ShieldCheck className="w-3 h-3 text-green-500" />}
                              {s.badge && s.badge !== 'none' && (
                                <Badge className={`text-[10px] px-1.5 py-0 ${s.badge === 'gold' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                                  {s.badge === 'gold' ? 'ذهبي' : 'مميز'}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-gray-500">
                          {CATEGORIES.find(c => c.key === s.category)?.labelAr || s.category || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{s.productCount}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{(s.rating || 0).toFixed(1)}</span>
                          <span className="text-[11px] text-gray-400">({s.reviewCount})</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${
                          s.status === 'active' ? 'bg-green-100 text-green-700' :
                          s.status === 'suspended' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {s.status === 'active' ? 'نشط' : s.status === 'suspended' ? 'معلق' : 'معلق'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-gray-500">{formatDate(s.joinedDate || s.createdAt || '')}</span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4 text-gray-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={() => setSelectedSupplier(s)}>
                              <Eye className="w-4 h-4 ml-2" /> عرض المتجر
                            </DropdownMenuItem>
                            {!s.isVerified && (
                              <DropdownMenuItem onClick={() => handleVerify(s.id)}>
                                <ShieldCheck className="w-4 h-4 ml-2" /> توثيق
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleToggleStatus(s.id, s.userId, s.status)}>
                              {s.status === 'active' ? (
                                <><Ban className="w-4 h-4 ml-2" /> تعليق</>
                              ) : (
                                <><CheckCircle className="w-4 h-4 ml-2" /> تفعيل</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => setDeleteDialog(s.id)}>
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

      {/* Supplier Detail Dialog */}
      <Dialog open={!!selectedSupplier} onOpenChange={() => setSelectedSupplier(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>تفاصيل المورد</DialogTitle>
            <DialogDescription>معلومات متجر المورد</DialogDescription>
          </DialogHeader>
          {selectedSupplier && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
                  {selectedSupplier.logoUrl ? (
                    <img src={selectedSupplier.logoUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <Building2 className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{selectedSupplier.name}</p>
                    {selectedSupplier.isVerified && <ShieldCheck className="w-4 h-4 text-green-500" />}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm text-gray-600">{(selectedSupplier.rating || 0).toFixed(1)}</span>
                    <span className="text-xs text-gray-400">({selectedSupplier.reviewCount} تقييم)</span>
                  </div>
                </div>
              </div>
              <div className="grid gap-2.5 text-sm">
                {selectedSupplier.email && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Globe className="w-4 h-4 text-gray-400 shrink-0" />
                    <span dir="ltr">{selectedSupplier.email}</span>
                  </div>
                )}
                {selectedSupplier.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                    <span dir="ltr">{selectedSupplier.phone}</span>
                  </div>
                )}
                {selectedSupplier.address && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>{selectedSupplier.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <Package className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{selectedSupplier.productCount} منتج</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
            <AlertDialogDescription>سيتم حذف المورد وجميع منتجاته نهائياً.</AlertDialogDescription>
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
