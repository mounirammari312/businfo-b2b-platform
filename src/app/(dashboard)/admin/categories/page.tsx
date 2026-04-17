'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  FolderTree, Plus, Pencil, Trash2, ChevronDown, ChevronRight,
  GripVertical, Search, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface CategoryData {
  id: string;
  name: string;
  nameEn: string;
  slug: string;
  icon: string;
  imageUrl?: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  subcategories: SubcategoryData[];
}

interface SubcategoryData {
  id: string;
  categoryId: string;
  name: string;
  nameEn: string;
  slug: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
}

// Demo categories
const demoCategories: CategoryData[] = [
  {
    id: '1', name: 'البناء والتشييد', nameEn: 'Construction', slug: 'construction', icon: 'Building', sortOrder: 1, isActive: true,
    subcategories: [
      { id: 's1', categoryId: '1', name: 'الإسمنت', nameEn: 'Cement', slug: 'cement', sortOrder: 1, isActive: true },
      { id: 's2', categoryId: '1', name: 'الحديد', nameEn: 'Iron', slug: 'iron', sortOrder: 2, isActive: true },
      { id: 's3', categoryId: '1', name: 'الطوب', nameEn: 'Bricks', slug: 'bricks', sortOrder: 3, isActive: false },
    ],
  },
  {
    id: '2', name: 'الكهرباء والإلكترونيات', nameEn: 'Electronics', slug: 'electronics', icon: 'Cpu', sortOrder: 2, isActive: true,
    subcategories: [
      { id: 's4', categoryId: '2', name: 'حواسيب', nameEn: 'Computers', slug: 'computers', sortOrder: 1, isActive: true },
      { id: 's5', categoryId: '2', name: 'هواتف', nameEn: 'Phones', slug: 'phones', sortOrder: 2, isActive: true },
    ],
  },
  {
    id: '3', name: 'الأغذية والمشروبات', nameEn: 'Food & Beverages', slug: 'food', icon: 'UtensilsCrossed', sortOrder: 3, isActive: true,
    subcategories: [
      { id: 's6', categoryId: '3', name: 'منتجات غذائية', nameEn: 'Food Products', slug: 'food-products', sortOrder: 1, isActive: true },
    ],
  },
  {
    id: '4', name: 'المنسوجات والأقمشة', nameEn: 'Textiles', slug: 'textiles', icon: 'Shirt', sortOrder: 4, isActive: true,
    subcategories: [],
  },
  {
    id: '5', name: 'قطع الغيار والسيارات', nameEn: 'Automotive', slug: 'automotive', icon: 'Car', sortOrder: 5, isActive: false,
    subcategories: [
      { id: 's7', categoryId: '5', name: 'قطع غيار', nameEn: 'Spare Parts', slug: 'spare-parts', sortOrder: 1, isActive: true },
    ],
  },
];

export default function AdminCategories() {
  const { profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryData[]>(demoCategories);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  // Category Dialog
  const [catDialog, setCatDialog] = useState<{ open: boolean; edit: CategoryData | null }>({ open: false, edit: null });
  const [catName, setCatName] = useState('');
  const [catNameEn, setCatNameEn] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catSortOrder, setCatSortOrder] = useState('0');
  const [catActive, setCatActive] = useState(true);

  // Subcategory Dialog
  const [subDialog, setSubDialog] = useState<{ open: boolean; edit: SubcategoryData | null; categoryId: string }>({ open: false, edit: null, categoryId: '' });
  const [subName, setSubName] = useState('');
  const [subNameEn, setSubNameEn] = useState('');
  const [subSortOrder, setSubSortOrder] = useState('0');
  const [subActive, setSubActive] = useState(true);

  // Delete Dialogs
  const [deleteCatDialog, setDeleteCatDialog] = useState<string | null>(null);
  const [deleteSubDialog, setDeleteSubDialog] = useState<{ subId: string; catId: string } | null>(null);

  const isAdmin = !authLoading && profile?.role === 'admin';
  const loading = authLoading || !isAdmin;

  const filteredCategories = categories.filter(c =>
    c.name.includes(search) || c.nameEn.toLowerCase().includes(search.toLowerCase())
  );

  const toggleExpand = (id: string) => {
    setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleCategoryActive = (id: string) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));
    toast.success('تم تحديث حالة التصنيف');
  };

  const openCatDialog = (edit?: CategoryData) => {
    if (edit) {
      setCatName(edit.name);
      setCatNameEn(edit.nameEn);
      setCatSlug(edit.slug);
      setCatSortOrder(String(edit.sortOrder));
      setCatActive(edit.isActive);
    } else {
      setCatName('');
      setCatNameEn('');
      setCatSlug('');
      setCatSortOrder(String(categories.length + 1));
      setCatActive(true);
    }
    setCatDialog({ open: true, edit: edit || null });
  };

  const saveCategory = () => {
    if (!catName.trim()) { toast.error('الاسم مطلوب'); return; }
    if (catDialog.edit) {
      setCategories(prev => prev.map(c =>
        c.id === catDialog.edit!.id ? {
          ...c, name: catName, nameEn: catNameEn || catName,
          slug: catSlug || catName.toLowerCase().replace(/\s/g, '-'),
          sortOrder: Number(catSortOrder), isActive: catActive,
        } : c
      ));
      toast.success('تم تحديث التصنيف');
    } else {
      setCategories(prev => [...prev, {
        id: Date.now().toString(), name: catName, nameEn: catNameEn || catName,
        slug: catSlug || catName.toLowerCase().replace(/\s/g, '-'),
        icon: 'Folder', sortOrder: Number(catSortOrder), isActive: catActive,
        subcategories: [],
      }]);
      toast.success('تم إضافة التصنيف');
    }
    setCatDialog({ open: false, edit: null });
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    toast.success('تم حذف التصنيف');
    setDeleteCatDialog(null);
  };

  const openSubDialog = (categoryId: string, edit?: SubcategoryData) => {
    if (edit) {
      setSubName(edit.name);
      setSubNameEn(edit.nameEn);
      setSubSortOrder(String(edit.sortOrder));
      setSubActive(edit.isActive);
    } else {
      setSubName('');
      setSubNameEn('');
      setSubSortOrder('1');
      setSubActive(true);
    }
    setSubDialog({ open: true, edit: edit || null, categoryId });
  };

  const saveSubcategory = () => {
    if (!subName.trim()) { toast.error('الاسم مطلوب'); return; }
    const { categoryId, edit } = subDialog;
    if (edit) {
      setCategories(prev => prev.map(c =>
        c.id === categoryId ? {
          ...c, subcategories: c.subcategories.map(s =>
            s.id === edit.id ? {
              ...s, name: subName, nameEn: subNameEn || subName,
              slug: subName.toLowerCase().replace(/\s/g, '-'),
              sortOrder: Number(subSortOrder), isActive: subActive,
            } : s
          ),
        } : c
      ));
      toast.success('تم تحديث التصنيف الفرعي');
    } else {
      setCategories(prev => prev.map(c =>
        c.id === categoryId ? {
          ...c, subcategories: [...c.subcategories, {
            id: Date.now().toString(), categoryId, name: subName,
            nameEn: subNameEn || subName, slug: subName.toLowerCase().replace(/\s/g, '-'),
            sortOrder: Number(subSortOrder), isActive: subActive,
          }],
        } : c
      ));
      toast.success('تم إضافة التصنيف الفرعي');
    }
    setSubDialog({ open: false, edit: null, categoryId: '' });
  };

  const deleteSubcategory = () => {
    if (!deleteSubDialog) return;
    setCategories(prev => prev.map(c =>
      c.id === deleteSubDialog.catId ? {
        ...c, subcategories: c.subcategories.filter(s => s.id !== deleteSubDialog.subId),
      } : c
    ));
    toast.success('تم حذف التصنيف الفرعي');
    setDeleteSubDialog(null);
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-[#1B3A5C]" />
            إدارة التصنيفات
          </h1>
          <p className="text-sm text-gray-500">{categories.length} تصنيف</p>
        </div>
        <Button onClick={() => openCatDialog()} className="gap-1.5">
          <Plus className="w-4 h-4" /> إضافة تصنيف
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="بحث عن تصنيف..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Categories List */}
      <div className="space-y-2">
        {filteredCategories.map((cat) => (
          <Card key={cat.id} className={!cat.isActive ? 'opacity-60' : ''}>
            <CardContent className="p-0">
              {/* Category Row */}
              <div className="flex items-center gap-3 p-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => toggleExpand(cat.id)}
                >
                  {expanded.includes(cat.id) ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </Button>

                <FolderTree className="w-4 h-4 text-[#1B3A5C] shrink-0" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{cat.name}</p>
                    <span className="text-xs text-gray-400" dir="ltr">{cat.nameEn}</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {cat.subcategories.length} تصنيف فرعي | ترتيب: {cat.sortOrder}
                  </p>
                </div>

                <Badge className={`text-xs ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {cat.isActive ? 'نشط' : 'غير نشط'}
                </Badge>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => toggleCategoryActive(cat.id)}
                    title={cat.isActive ? 'إلغاء التفعيل' : 'تفعيل'}
                  >
                    {cat.isActive ? (
                      <ToggleRight className="w-4 h-4 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-4 h-4 text-gray-400" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => openSubDialog(cat.id)}
                    title="إضافة تصنيف فرعي"
                  >
                    <Plus className="w-4 h-4 text-[#1B3A5C]" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => openCatDialog(cat)}
                  >
                    <Pencil className="w-3.5 h-3.5 text-gray-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setDeleteCatDialog(cat.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </Button>
                </div>
              </div>

              {/* Subcategories */}
              {expanded.includes(cat.id) && cat.subcategories.length > 0 && (
                <div className="border-t border-gray-100 bg-gray-50/50">
                  {cat.subcategories.map((sub, idx) => (
                    <div
                      key={sub.id}
                      className={`flex items-center gap-3 px-12 py-3 ${idx < cat.subcategories.length - 1 ? 'border-b border-gray-100' : ''}`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-[#1B3A5C] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-700">{sub.name}</p>
                          <span className="text-xs text-gray-400" dir="ltr">{sub.nameEn}</span>
                        </div>
                        <p className="text-[11px] text-gray-400">ترتيب: {sub.sortOrder}</p>
                      </div>
                      <Badge className={`text-[11px] ${sub.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {sub.isActive ? 'نشط' : 'غير نشط'}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openSubDialog(cat.id, sub)}>
                        <Pencil className="w-3 h-3 text-gray-400" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDeleteSubDialog({ subId: sub.id, catId: cat.id })}>
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {expanded.includes(cat.id) && cat.subcategories.length === 0 && (
                <div className="border-t border-gray-100 py-6 px-12 text-center">
                  <p className="text-xs text-gray-400">لا يوجد تصنيفات فرعية</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Category Dialog */}
      <Dialog open={catDialog.open} onOpenChange={() => setCatDialog({ open: false, edit: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{catDialog.edit ? 'تعديل التصنيف' : 'إضافة تصنيف'}</DialogTitle>
            <DialogDescription>أدخل بيانات التصنيف</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">الاسم (عربي)</Label>
                <Input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="البناء والتشييد" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">الاسم (إنجليزي)</Label>
                <Input value={catNameEn} onChange={(e) => setCatNameEn(e.target.value)} placeholder="Construction" dir="ltr" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">الرابط (Slug)</Label>
                <Input value={catSlug} onChange={(e) => setCatSlug(e.target.value)} placeholder="construction" dir="ltr" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">ترتيب</Label>
                <Input type="number" value={catSortOrder} onChange={(e) => setCatSortOrder(e.target.value)} dir="ltr" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">نشط</Label>
              <Switch checked={catActive} onCheckedChange={setCatActive} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialog({ open: false, edit: null })}>إلغاء</Button>
            <Button onClick={saveCategory}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subcategory Dialog */}
      <Dialog open={subDialog.open} onOpenChange={() => setSubDialog({ open: false, edit: null, categoryId: '' })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{subDialog.edit ? 'تعديل التصنيف الفرعي' : 'إضافة تصنيف فرعي'}</DialogTitle>
            <DialogDescription>أدخل بيانات التصنيف الفرعي</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">الاسم (عربي)</Label>
                <Input value={subName} onChange={(e) => setSubName(e.target.value)} placeholder="الإسمنت" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">الاسم (إنجليزي)</Label>
                <Input value={subNameEn} onChange={(e) => setSubNameEn(e.target.value)} placeholder="Cement" dir="ltr" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">ترتيب</Label>
              <Input type="number" value={subSortOrder} onChange={(e) => setSubSortOrder(e.target.value)} dir="ltr" />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">نشط</Label>
              <Switch checked={subActive} onCheckedChange={setSubActive} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubDialog({ open: false, edit: null, categoryId: '' })}>إلغاء</Button>
            <Button onClick={saveSubcategory}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category */}
      <AlertDialog open={!!deleteCatDialog} onOpenChange={() => setDeleteCatDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
            <AlertDialogDescription>سيتم حذف التصنيف وجميع التصنيفات الفرعية نهائياً.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteCatDialog && deleteCategory(deleteCatDialog)}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Subcategory */}
      <AlertDialog open={!!deleteSubDialog} onOpenChange={() => setDeleteSubDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
            <AlertDialogDescription>سيتم حذف التصنيف الفرعي نهائياً.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={deleteSubcategory}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
