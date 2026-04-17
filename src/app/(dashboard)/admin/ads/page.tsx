'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { formatDate, formatNumber } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Megaphone, Plus, Pencil, Trash2, CheckCircle, XCircle, Clock,
  Eye, BarChart3, MousePointerClick, DollarSign, CalendarDays,
} from 'lucide-react';
import { toast } from 'sonner';

const demoAdTypes = [
  { id: '1', name: 'إعلان رئيسي', name_en: 'Top Banner', placement_type: 'banner', description: 'إعلان في أعلى الصفحة الرئيسية', price: 15000, is_active: true },
  { id: '2', name: 'منتج مميز', name_en: 'Featured Product', placement_type: 'featured', description: 'عرض المنتج في قسم المنتجات المميزة', price: 8000, is_active: true },
  { id: '3', name: 'تعزيز منتج', name_en: 'Product Boost', placement_type: 'product_boost', description: 'تعزيز ظهور المنتج في نتائج البحث', price: 5000, is_active: true },
  { id: '4', name: 'إعلان تصنيف', name_en: 'Category Ad', placement_type: 'category', description: 'إعلان داخل صفحة التصنيف', price: 10000, is_active: false },
];

const placementLabels: Record<string, string> = {
  banner: 'إعلان رئيسي',
  featured: 'مميز',
  product_boost: 'تعزيز منتج',
  category: 'تصنيف',
  sidebar: 'شريط جانبي',
};

const demoAdRequests = [
  { id: '1', supplier_name: 'شركة النور للإلكترونيات', ad_type_id: '1', ad_type_name: 'إعلان رئيسي', title: 'تخفيضات الشتاء', status: 'pending', message: 'نريد نشر إعلان للتخفيضات', budget: 15000, impressions: 0, clicks: 0, start_date: null, end_date: null, created_at: '2025-01-15T10:30:00Z' },
  { id: '2', supplier_name: 'مؤسسة البناء المتقدم', ad_type_id: '3', ad_type_name: 'تعزيز منتج', title: 'إسمنت عالي الجودة', status: 'pending', message: 'تعزيز منتج الإسمنت', budget: 5000, impressions: 0, clicks: 0, start_date: null, end_date: null, created_at: '2025-01-14T14:20:00Z' },
  { id: '3', supplier_name: 'شركة الأمل للأغذية', ad_type_id: '2', ad_type_name: 'منتج مميز', title: 'زيت زيتون ممتاز', status: 'active', message: 'عرض منتج زيت الزيتون', budget: 8000, impressions: 12500, clicks: 340, start_date: '2025-01-01', end_date: '2025-02-01', created_at: '2024-12-28T09:00:00Z' },
  { id: '4', supplier_name: 'معرض التقنية الحديثة', ad_type_id: '1', ad_type_name: 'إعلان رئيسي', title: 'أحدث الحواسيب', status: 'active', message: 'إعلان عن أحدث الحواسيب المحمولة', budget: 15000, impressions: 28000, clicks: 890, start_date: '2025-01-01', end_date: '2025-03-01', created_at: '2024-12-25T16:00:00Z' },
  { id: '5', supplier_name: 'شركة الخليج للمنسوجات', ad_type_id: '2', ad_type_name: 'منتج مميز', title: 'أقمشة حريرية', status: 'rejected', message: 'إعلان عن الأقمشة', budget: 8000, impressions: 0, clicks: 0, start_date: null, end_date: null, created_at: '2025-01-05T11:30:00Z', admin_note: 'الصورة غير مناسبة' },
];

export default function AdminAds() {
  const { profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [adTypes, setAdTypes] = useState(demoAdTypes);
  const [adRequests, setAdRequests] = useState(demoAdRequests);
  const [activeTab, setActiveTab] = useState('types');

  // Ad Type Dialog
  const [typeDialog, setTypeDialog] = useState<{ open: boolean; edit: typeof demoAdTypes[0] | null }>({ open: false, edit: null });
  const [typeName, setTypeName] = useState('');
  const [typeNameEn, setTypeNameEn] = useState('');
  const [typePlacement, setTypePlacement] = useState('banner');
  const [typePrice, setTypePrice] = useState('0');
  const [typeDesc, setTypeDesc] = useState('');
  const [typeActive, setTypeActive] = useState(true);

  // Approve Dialog
  const [approveDialog, setApproveDialog] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Reject Dialog
  const [rejectDialog, setRejectDialog] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Delete Dialog
  const [deleteTypeDialog, setDeleteTypeDialog] = useState<string | null>(null);

  const isAdmin = !authLoading && profile?.role === 'admin';
  const loading = authLoading || !isAdmin;

  const openTypeDialog = (edit?: typeof demoAdTypes[0]) => {
    if (edit) {
      setTypeName(edit.name);
      setTypeNameEn(edit.name_en);
      setTypePlacement(edit.placement_type);
      setTypePrice(String(edit.price));
      setTypeDesc(edit.description || '');
      setTypeActive(edit.is_active);
    } else {
      setTypeName('');
      setTypeNameEn('');
      setTypePlacement('banner');
      setTypePrice('0');
      setTypeDesc('');
      setTypeActive(true);
    }
    setTypeDialog({ open: true, edit: edit || null });
  };

  const saveAdType = () => {
    if (!typeName.trim()) { toast.error('الاسم مطلوب'); return; }
    if (typeDialog.edit) {
      setAdTypes(prev => prev.map(at =>
        at.id === typeDialog.edit!.id ? {
          ...at, name: typeName, name_en: typeNameEn || typeName,
          placement_type: typePlacement, description: typeDesc,
          price: Number(typePrice), is_active: typeActive,
        } : at
      ));
      toast.success('تم تحديث نوع الإعلان');
    } else {
      setAdTypes(prev => [...prev, {
        id: Date.now().toString(), name: typeName, name_en: typeNameEn || typeName,
        placement_type: typePlacement, description: typeDesc,
        price: Number(typePrice), is_active: typeActive,
      }]);
      toast.success('تم إضافة نوع الإعلان');
    }
    setTypeDialog({ open: false, edit: null });
  };

  const handleApprove = () => {
    if (!approveDialog || !startDate || !endDate) { toast.error('يرجى تحديد التواريخ'); return; }
    setAdRequests(prev => prev.map(r =>
      r.id === approveDialog ? { ...r, status: 'active', start_date: startDate, end_date: endDate } : r
    ));
    toast.success('تم تفعيل الإعلان');
    setApproveDialog(null);
    setStartDate('');
    setEndDate('');
  };

  const handleReject = () => {
    if (!rejectDialog || !rejectReason.trim()) { toast.error('سبب الرفض مطلوب'); return; }
    setAdRequests(prev => prev.map(r =>
      r.id === rejectDialog ? { ...r, status: 'rejected', admin_note: rejectReason } : r
    ));
    toast.success('تم رفض الإعلان');
    setRejectDialog(null);
    setRejectReason('');
  };

  const deleteAdType = (id: string) => {
    setAdTypes(prev => prev.filter(at => at.id !== id));
    toast.success('تم حذف نوع الإعلان');
    setDeleteTypeDialog(null);
  };

  const pendingRequests = adRequests.filter(r => r.status === 'pending');
  const activeAds = adRequests.filter(r => r.status === 'active');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-700 text-xs">قيد المراجعة</Badge>;
      case 'active': return <Badge className="bg-green-100 text-green-700 text-xs">نشط</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-700 text-xs">مرفوض</Badge>;
      case 'expired': return <Badge className="bg-gray-100 text-gray-600 text-xs">منتهي</Badge>;
      default: return null;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Card><CardContent className="p-6">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 mb-2" />)}</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[#1B3A5C]" />
            إدارة الإعلانات
          </h1>
          <p className="text-sm text-gray-500">{activeAds.length} إعلان نشط | {pendingRequests.length} طلب معلق</p>
        </div>
        <Button onClick={() => openTypeDialog()} className="gap-1.5">
          <Plus className="w-4 h-4" /> إضافة نوع
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="types" className="gap-1.5">
            <Megaphone className="w-3.5 h-3.5" /> أنواع الإعلانات
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-1.5">
            <Clock className="w-3.5 h-3.5" /> طلبات معلقة {pendingRequests.length > 0 && `(${pendingRequests.length})`}
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-1.5">
            <Eye className="w-3.5 h-3.5" /> إعلانات نشطة {activeAds.length > 0 && `(${activeAds.length})`}
          </TabsTrigger>
        </TabsList>

        {/* Ad Types Tab */}
        <TabsContent value="types" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="text-xs font-semibold">الاسم</TableHead>
                    <TableHead className="text-xs font-semibold">الموضع</TableHead>
                    <TableHead className="text-xs font-semibold">السعر</TableHead>
                    <TableHead className="text-xs font-semibold">الحالة</TableHead>
                    <TableHead className="text-xs font-semibold text-start">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adTypes.map((at, idx) => (
                    <TableRow key={at.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{at.name}</p>
                          <p className="text-xs text-gray-400">{at.name_en}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{placementLabels[at.placement_type] || at.placement_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">{Number(at.price).toLocaleString()} د.ج</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${at.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {at.is_active ? 'نشط' : 'غير نشط'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openTypeDialog(at)}>
                            <Pencil className="w-3.5 h-3.5 text-gray-500" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteTypeDialog(at.id)}>
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Requests Tab */}
        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="text-xs font-semibold">المورد</TableHead>
                    <TableHead className="text-xs font-semibold">نوع الإعلان</TableHead>
                    <TableHead className="text-xs font-semibold">العنوان</TableHead>
                    <TableHead className="text-xs font-semibold">الميزانية</TableHead>
                    <TableHead className="text-xs font-semibold">التاريخ</TableHead>
                    <TableHead className="text-xs font-semibold text-start">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                        <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">لا يوجد طلبات معلقة</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingRequests.map((req, idx) => (
                      <TableRow key={req.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                        <TableCell><span className="text-sm font-medium">{req.supplier_name}</span></TableCell>
                        <TableCell><Badge variant="secondary" className="text-xs">{req.ad_type_name}</Badge></TableCell>
                        <TableCell><span className="text-sm">{req.title}</span></TableCell>
                        <TableCell><span className="text-sm font-medium">{Number(req.budget).toLocaleString()} د.ج</span></TableCell>
                        <TableCell><span className="text-xs text-gray-500">{formatDate(req.created_at)}</span></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="outline" className="h-7 text-green-600 hover:bg-green-50" onClick={() => setApproveDialog(req.id)}>
                              <CheckCircle className="w-3.5 h-3.5 ml-1" /> قبول
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-red-600 hover:bg-red-50" onClick={() => setRejectDialog(req.id)}>
                              <XCircle className="w-3.5 h-3.5 ml-1" /> رفض
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Ads Tab */}
        <TabsContent value="active" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="text-xs font-semibold">المورد</TableHead>
                    <TableHead className="text-xs font-semibold">الإعلان</TableHead>
                    <TableHead className="text-xs font-semibold">الفترة</TableHead>
                    <TableHead className="text-xs font-semibold">المشاهدات</TableHead>
                    <TableHead className="text-xs font-semibold">النقرات</TableHead>
                    <TableHead className="text-xs font-semibold">معدل النقر</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeAds.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                        <Megaphone className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">لا يوجد إعلانات نشطة</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    activeAds.map((ad, idx) => {
                      const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : '0';
                      return (
                        <TableRow key={ad.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                          <TableCell><span className="text-sm font-medium">{ad.supplier_name}</span></TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">{ad.title}</p>
                              <p className="text-xs text-gray-400">{ad.ad_type_name}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <CalendarDays className="w-3 h-3" />
                              {ad.start_date && ad.end_date ? `${ad.start_date} - ${ad.end_date}` : '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-sm">{formatNumber(ad.impressions)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MousePointerClick className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-sm">{formatNumber(ad.clicks)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">{ctr}%</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Ad Type Dialog */}
      <Dialog open={typeDialog.open} onOpenChange={() => setTypeDialog({ open: false, edit: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{typeDialog.edit ? 'تعديل نوع الإعلان' : 'إضافة نوع إعلان'}</DialogTitle>
            <DialogDescription>أدخل بيانات نوع الإعلان</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">الاسم (عربي)</Label>
                <Input value={typeName} onChange={(e) => setTypeName(e.target.value)} placeholder="إعلان رئيسي" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">الاسم (إنجليزي)</Label>
                <Input value={typeNameEn} onChange={(e) => setTypeNameEn(e.target.value)} placeholder="Top Banner" dir="ltr" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">الموضع</Label>
                <Select value={typePlacement} onValueChange={setTypePlacement}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="banner">إعلان رئيسي</SelectItem>
                    <SelectItem value="featured">مميز</SelectItem>
                    <SelectItem value="product_boost">تعزيز منتج</SelectItem>
                    <SelectItem value="category">تصنيف</SelectItem>
                    <SelectItem value="sidebar">شريط جانبي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">السعر (د.ج)</Label>
                <Input type="number" value={typePrice} onChange={(e) => setTypePrice(e.target.value)} dir="ltr" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">الوصف</Label>
              <Textarea value={typeDesc} onChange={(e) => setTypeDesc(e.target.value)} rows={2} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">نشط</Label>
              <Switch checked={typeActive} onCheckedChange={setTypeActive} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTypeDialog({ open: false, edit: null })}>إلغاء</Button>
            <Button onClick={saveAdType}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={!!approveDialog} onOpenChange={() => setApproveDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>تفعيل الإعلان</DialogTitle>
            <DialogDescription>تحديد فترة عرض الإعلان</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">تاريخ البدء</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">تاريخ الانتهاء</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog(null)}>إلغاء</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleApprove}>تفعيل</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>رفض الإعلان</DialogTitle>
            <DialogDescription>أدخل سبب الرفض</DialogDescription>
          </DialogHeader>
          <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="سبب الرفض..." rows={3} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(null)}>إلغاء</Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={handleReject}>رفض</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTypeDialog} onOpenChange={() => setDeleteTypeDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
            <AlertDialogDescription>سيتم حذف نوع الإعلان نهائياً.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteTypeDialog && deleteAdType(deleteTypeDialog)}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
