'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
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
import {
  Award, Plus, Pencil, Trash2, CheckCircle, XCircle, Clock,
  MoreHorizontal, Star, Shield, CalendarDays,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Demo badge types
const demoBadgeTypes = [
  { id: '1', name: 'مميز ذهبي', name_en: 'Gold Featured', slug: 'gold-featured', icon: 'Star', color: '#E8A838', description: 'شارة ذهبية للموردين المميزين', price: 5000, is_active: true },
  { id: '2', name: 'مميز أزرق', name_en: 'Blue Featured', slug: 'blue-featured', icon: 'Shield', color: '#1B3A5C', description: 'شارة زرقاء للموردين الموثوقين', price: 3000, is_active: true },
  { id: '3', name: 'معتمد', name_en: 'Verified', slug: 'verified', icon: 'CheckCircle', color: '#059669', description: 'شارة التوثيق للموردين المعتمدين', price: 2000, is_active: true },
  { id: '4', name: 'مبتدئ', name_en: 'Starter', slug: 'starter', icon: 'Award', color: '#6B7280', description: 'شارة البداية للموردين الجدد', price: 0, is_active: false },
];

const demoBadgeRequests = [
  { id: '1', supplier_id: 's1', supplier_name: 'شركة النور للإلكترونيات', badge_type_id: '1', badge_name: 'مميز ذهبي', status: 'pending', message: 'نطلب الحصول على الشارة الذهبية لزيادة ظهور منتجاتنا', admin_note: null, created_at: '2025-01-15T10:30:00Z' },
  { id: '2', supplier_id: 's2', supplier_name: 'مؤسسة البناء المتقدم', badge_type_id: '2', badge_name: 'مميز أزرق', status: 'pending', message: 'نريد الحصول على الشارة المميزة الأزرق', admin_note: null, created_at: '2025-01-14T14:20:00Z' },
  { id: '3', supplier_id: 's3', supplier_name: 'شركة الأمل للأغذية', badge_type_id: '3', badge_name: 'معتمد', status: 'approved', message: 'طلب توثيق حسابنا', admin_note: 'تم التحقق من الوثائق بنجاح', created_at: '2025-01-10T09:00:00Z' },
  { id: '4', supplier_id: 's4', supplier_name: 'معرض التقنية الحديثة', badge_type_id: '1', badge_name: 'مميز ذهبي', status: 'rejected', message: 'نريد الشارة الذهبية', admin_note: 'الوثائق غير مكتملة', created_at: '2025-01-08T16:00:00Z' },
  { id: '5', supplier_id: 's5', supplier_name: 'شركة الخليج للمنسوجات', badge_type_id: '2', badge_name: 'مميز أزرق', status: 'approved', message: 'طلب شارة مميزة أزرق', admin_note: 'موافقة', created_at: '2025-01-05T11:30:00Z' },
];

export default function AdminBadges() {
  const { profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [badgeTypes, setBadgeTypes] = useState(demoBadgeTypes);
  const [requests, setRequests] = useState(demoBadgeRequests);
  const [activeTab, setActiveTab] = useState('types');

  // Badge Type Dialog
  const [typeDialog, setTypeDialog] = useState<{ open: boolean; edit: typeof demoBadgeTypes[0] | null }>({ open: false, edit: null });
  const [typeName, setTypeName] = useState('');
  const [typeNameEn, setTypeNameEn] = useState('');
  const [typeColor, setTypeColor] = useState('#1B3A5C');
  const [typePrice, setTypePrice] = useState('0');
  const [typeDescription, setTypeDescription] = useState('');
  const [typeActive, setTypeActive] = useState(true);

  // Approval Dialog
  const [approveDialog, setApproveDialog] = useState<string | null>(null);
  const [expiryDate, setExpiryDate] = useState('');

  // Rejection Dialog
  const [rejectDialog, setRejectDialog] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Delete Dialog
  const [deleteTypeDialog, setDeleteTypeDialog] = useState<string | null>(null);

  const isAdmin = !authLoading && profile?.role === 'admin';
  const loading = authLoading || !isAdmin;

  const openTypeDialog = (edit?: typeof demoBadgeTypes[0]) => {
    if (edit) {
      setTypeName(edit.name);
      setTypeNameEn(edit.name_en);
      setTypeColor(edit.color);
      setTypePrice(String(edit.price));
      setTypeDescription(edit.description || '');
      setTypeActive(edit.is_active);
    } else {
      setTypeName('');
      setTypeNameEn('');
      setTypeColor('#1B3A5C');
      setTypePrice('0');
      setTypeDescription('');
      setTypeActive(true);
    }
    setTypeDialog({ open: true, edit: edit || null });
  };

  const saveBadgeType = () => {
    if (!typeName.trim()) { toast.error('الاسم مطلوب'); return; }
    if (typeDialog.edit) {
      setBadgeTypes(prev => prev.map(bt =>
        bt.id === typeDialog.edit!.id ? {
          ...bt, name: typeName, name_en: typeNameEn, color: typeColor,
          price: Number(typePrice), description: typeDescription, is_active: typeActive,
        } : bt
      ));
      toast.success('تم تحديث نوع الشارة');
    } else {
      const newType = {
        id: Date.now().toString(), name: typeName, name_en: typeNameEn || typeName,
        slug: typeName.toLowerCase().replace(/\s/g, '-'), icon: 'Star',
        color: typeColor, description: typeDescription,
        price: Number(typePrice), is_active: typeActive,
      };
      setBadgeTypes(prev => [...prev, newType]);
      toast.success('تم إضافة نوع الشارة');
    }
    setTypeDialog({ open: false, edit: null });
  };

  const handleApprove = () => {
    if (!approveDialog) return;
    setRequests(prev => prev.map(r =>
      r.id === approveDialog ? { ...r, status: 'approved', admin_note: `تم الموافقة - تاريخ الانتهاء: ${expiryDate}` } : r
    ));
    toast.success('تم قبول طلب الشارة');
    setApproveDialog(null);
    setExpiryDate('');
  };

  const handleReject = () => {
    if (!rejectDialog) return;
    if (!rejectReason.trim()) { toast.error('سبب الرفض مطلوب'); return; }
    setRequests(prev => prev.map(r =>
      r.id === rejectDialog ? { ...r, status: 'rejected', admin_note: rejectReason } : r
    ));
    toast.success('تم رفض طلب الشارة');
    setRejectDialog(null);
    setRejectReason('');
  };

  const deleteBadgeType = (id: string) => {
    setBadgeTypes(prev => prev.filter(bt => bt.id !== id));
    toast.success('تم حذف نوع الشارة');
    setDeleteTypeDialog(null);
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Card><CardContent className="p-6">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 mb-2" />)}</CardContent></Card>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const allRequests = requests;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-700 text-xs">قيد المراجعة</Badge>;
      case 'approved': return <Badge className="bg-green-100 text-green-700 text-xs">مقبول</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-700 text-xs">مرفوض</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-[#1B3A5C]" />
            إدارة الشارات
          </h1>
          <p className="text-sm text-gray-500">{badgeTypes.length} نوع شارة | {pendingRequests.length} طلب معلق</p>
        </div>
        <Button onClick={() => openTypeDialog()} className="gap-1.5">
          <Plus className="w-4 h-4" /> إضافة نوع
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="types" className="gap-1.5">
            <Star className="w-3.5 h-3.5" /> أنواع الشارات
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-1.5">
            <Clock className="w-3.5 h-3.5" /> طلبات معلقة {pendingRequests.length > 0 && `(${pendingRequests.length})`}
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-1.5">
            <Shield className="w-3.5 h-3.5" /> جميع الطلبات
          </TabsTrigger>
        </TabsList>

        {/* Badge Types Tab */}
        <TabsContent value="types" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="text-xs font-semibold">الاسم</TableHead>
                    <TableHead className="text-xs font-semibold">اللون</TableHead>
                    <TableHead className="text-xs font-semibold">السعر</TableHead>
                    <TableHead className="text-xs font-semibold">الحالة</TableHead>
                    <TableHead className="text-xs font-semibold text-start">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {badgeTypes.map((bt, idx) => (
                    <TableRow key={bt.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: bt.color + '20' }}>
                            <Star className="w-4 h-4" style={{ color: bt.color }} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{bt.name}</p>
                            <p className="text-xs text-gray-400">{bt.name_en}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: bt.color }} />
                          <span className="text-xs text-gray-500" dir="ltr">{bt.color}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">{Number(bt.price).toLocaleString()} د.ج</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${bt.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {bt.is_active ? 'نشط' : 'غير نشط'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openTypeDialog(bt)}>
                            <Pencil className="w-3.5 h-3.5 text-gray-500" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteTypeDialog(bt.id)}>
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
                    <TableHead className="text-xs font-semibold">نوع الشارة</TableHead>
                    <TableHead className="text-xs font-semibold">الرسالة</TableHead>
                    <TableHead className="text-xs font-semibold">التاريخ</TableHead>
                    <TableHead className="text-xs font-semibold text-start">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-gray-400">
                        <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">لا يوجد طلبات معلقة</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingRequests.map((req, idx) => (
                      <TableRow key={req.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                        <TableCell>
                          <span className="text-sm font-medium text-gray-900">{req.supplier_name}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className="text-xs">{req.badge_name}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-gray-500 truncate max-w-48 block">{req.message}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-gray-500">{formatDate(req.created_at)}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="outline" className="h-7 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => setApproveDialog(req.id)}>
                              <CheckCircle className="w-3.5 h-3.5 ml-1" /> قبول
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setRejectDialog(req.id)}>
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

        {/* All Requests Tab */}
        <TabsContent value="all" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="text-xs font-semibold">المورد</TableHead>
                    <TableHead className="text-xs font-semibold">نوع الشارة</TableHead>
                    <TableHead className="text-xs font-semibold">الرسالة</TableHead>
                    <TableHead className="text-xs font-semibold">الحالة</TableHead>
                    <TableHead className="text-xs font-semibold">ملاحظة الإدارة</TableHead>
                    <TableHead className="text-xs font-semibold">التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allRequests.map((req, idx) => (
                    <TableRow key={req.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                      <TableCell>
                        <span className="text-sm font-medium text-gray-900">{req.supplier_name}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className="text-xs">{req.badge_name}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-gray-500 truncate max-w-40 block">{req.message}</span>
                      </TableCell>
                      <TableCell>{getStatusBadge(req.status)}</TableCell>
                      <TableCell>
                        <span className="text-xs text-gray-500">{req.admin_note || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-gray-500">{formatDate(req.created_at)}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Badge Type Dialog */}
      <Dialog open={typeDialog.open} onOpenChange={() => setTypeDialog({ open: false, edit: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{typeDialog.edit ? 'تعديل نوع الشارة' : 'إضافة نوع شارة'}</DialogTitle>
            <DialogDescription>أدخل بيانات نوع الشارة</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">الاسم (عربي)</Label>
                <Input value={typeName} onChange={(e) => setTypeName(e.target.value)} placeholder="مميز ذهبي" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">الاسم (إنجليزي)</Label>
                <Input value={typeNameEn} onChange={(e) => setTypeNameEn(e.target.value)} placeholder="Gold Featured" dir="ltr" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">اللون</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={typeColor} onChange={(e) => setTypeColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0" />
                  <Input value={typeColor} onChange={(e) => setTypeColor(e.target.value)} dir="ltr" className="flex-1" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">السعر (د.ج)</Label>
                <Input type="number" value={typePrice} onChange={(e) => setTypePrice(e.target.value)} dir="ltr" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">الوصف</Label>
              <Textarea value={typeDescription} onChange={(e) => setTypeDescription(e.target.value)} rows={2} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">نشط</Label>
              <Switch checked={typeActive} onCheckedChange={setTypeActive} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTypeDialog({ open: false, edit: null })}>إلغاء</Button>
            <Button onClick={saveBadgeType}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={!!approveDialog} onOpenChange={() => setApproveDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>قبول طلب الشارة</DialogTitle>
            <DialogDescription>تحديد تاريخ انتهاء الشارة</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">تاريخ الانتهاء</Label>
              <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog(null)}>إلغاء</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleApprove}>قبول</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>رفض طلب الشارة</DialogTitle>
            <DialogDescription>أدخل سبب الرفض</DialogDescription>
          </DialogHeader>
          <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="سبب الرفض..." rows={3} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(null)}>إلغاء</Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={handleReject}>رفض</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Type Dialog */}
      <AlertDialog open={!!deleteTypeDialog} onOpenChange={() => setDeleteTypeDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
            <AlertDialogDescription>سيتم حذف نوع الشارة نهائياً.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteTypeDialog && deleteBadgeType(deleteTypeDialog)}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
