'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useLocaleStore } from '@/lib/store';
import { cn, generateSlug } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Plus,
  Trash2,
  Upload,
  X,
  Loader2,
  ArrowLeft,
  ImageIcon,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const UNITS = [
  { value: 'piece', ar: 'قطعة', en: 'Piece' },
  { value: 'kg', ar: 'كيلوغرام', en: 'Kilogram' },
  { value: 'liter', ar: 'لتر', en: 'Liter' },
  { value: 'box', ar: 'صندوق', en: 'Box' },
  { value: 'meter', ar: 'متر', en: 'Meter' },
  { value: 'ton', ar: 'طن', en: 'Ton' },
  { value: 'carton', ar: 'كرتون', en: 'Carton' },
  { value: 'pallet', ar: 'باليت', en: 'Pallet' },
];

const VARIATION_TYPES = [
  { value: 'size', ar: 'الحجم', en: 'Size' },
  { value: 'color', ar: 'اللون', en: 'Color' },
  { value: 'material', ar: 'المادة', en: 'Material' },
  { value: 'weight', ar: 'الوزن', en: 'Weight' },
];

interface Variation {
  type: string;
  value: string;
  sku: string;
  price_override: string;
  stock_quantity: string;
}

interface ExistingImage {
  id: string;
  url: string;
  is_primary: boolean;
}

export default function EditProduct() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const { locale } = useLocaleStore();
  const { supplier } = useAuth();
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string; name_en: string }[]>([]);
  const [subcategories, setSubcategories] = useState<{ id: string; name: string; name_en: string }[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [descAr, setDescAr] = useState('');
  const [descEn, setDescEn] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('DZD');
  const [minOrder, setMinOrder] = useState('1');
  const [unit, setUnit] = useState('piece');
  const [stockQuantity, setStockQuantity] = useState('');
  const [status, setStatus] = useState('active');
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadCategories();
    loadProduct();
  }, [productId]);

  const loadCategories = async () => {
    const { data } = await supabase.from('categories').select('id, name, name_en').eq('is_active', true);
    setCategories((data || []).map(c => ({ id: c.id, name: c.name, name_en: c.name_en })));
  };

  const loadProduct = async () => {
    setInitialLoading(true);
    try {
      const { data: product, error } = await supabase
        .from('products')
        .select('*, product_images(id, url, is_primary), product_variations(id, variation_type, variation_value, sku, price_override, stock_quantity)')
        .eq('id', productId)
        .single();

      if (error || !product) {
        toast.error(locale === 'ar' ? 'المنتج غير موجود' : 'Product not found');
        router.push('/supplier/products');
        return;
      }

      setNameAr(product.name || '');
      setNameEn(product.name_en || '');
      setDescAr(product.description || '');
      setDescEn(product.description_en || '');
      setPrice(String(product.price));
      setCurrency(product.currency);
      setMinOrder(String(product.min_order));
      setUnit(product.unit);
      setStockQuantity(product.stock_quantity != null ? String(product.stock_quantity) : '');
      setStatus(product.status);
      setCategoryId(product.category_id || '');
      setSubcategoryId(product.subcategory_id || '');

      if (product.category_id) {
        const { data: subs } = await supabase.from('subcategories').select('id, name, name_en').eq('category_id', product.category_id).eq('is_active', true);
        setSubcategories((subs || []).map(s => ({ id: s.id, name: s.name, name_en: s.name_en })));
      }

      setExistingImages((product.product_images || []).map((img: Record<string, unknown>) => ({
        id: img.id as string,
        url: img.url as string,
        is_primary: img.is_primary as boolean,
      })));

      setVariations((product.product_variations || []).map((v: Record<string, unknown>) => ({
        type: v.variation_type as string,
        value: v.variation_value as string,
        sku: (v.sku as string) || '',
        price_override: v.price_override != null ? String(v.price_override) : '',
        stock_quantity: v.stock_quantity != null ? String(v.stock_quantity) : '',
      })));
    } catch (err) {
      console.error('Failed to load product:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  const loadSubcategories = useCallback(async (catId: string) => {
    if (!catId) { setSubcategories([]); setSubcategoryId(''); return; }
    const { data } = await supabase.from('subcategories').select('id, name, name_en').eq('category_id', catId).eq('is_active', true);
    setSubcategories((data || []).map(s => ({ id: s.id, name: s.name, name_en: s.name_en })));
  }, []);

  useEffect(() => {
    loadSubcategories(categoryId);
  }, [categoryId, loadSubcategories]);

  const handleNewImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxNew = 5 - existingImages.length;
    const validFiles = files.slice(0, maxNew);
    setNewImages(prev => [...prev, ...validFiles]);
    setNewImagePreviews(prev => [...prev, ...validFiles.map(f => URL.createObjectURL(f))]);
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imageId: string) => {
    setExistingImages(prev => prev.filter(img => img.id !== imageId));
    setRemovedImageIds(prev => [...prev, imageId]);
  };

  const addVariation = () => {
    setVariations(prev => [...prev, { type: 'size', value: '', sku: '', price_override: '', stock_quantity: '' }]);
  };

  const updateVariation = (index: number, field: keyof Variation, value: string) => {
    setVariations(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };

  const removeVariation = (index: number) => {
    setVariations(prev => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!nameAr.trim()) errs.nameAr = locale === 'ar' ? 'اسم المنتج بالعربية مطلوب' : 'Product name in Arabic is required';
    if (!price || Number(price) <= 0) errs.price = locale === 'ar' ? 'السعر مطلوب' : 'Price is required';
    if (!categoryId) errs.category = locale === 'ar' ? 'التصنيف مطلوب' : 'Category is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !supplier?.id) return;

    setLoading(true);
    try {
      const slug = generateSlug(nameEn || nameAr);

      const { error: updateError } = await supabase
        .from('products')
        .update({
          name: nameAr.trim(),
          name_en: nameEn.trim() || null,
          slug,
          description: descAr.trim() || null,
          description_en: descEn.trim() || null,
          price: Number(price),
          currency,
          category_id: categoryId || null,
          subcategory_id: subcategoryId || null,
          min_order: Number(minOrder) || 1,
          unit,
          stock_quantity: stockQuantity ? Number(stockQuantity) : null,
          in_stock: !stockQuantity || Number(stockQuantity) > 0,
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId);

      if (updateError) throw updateError;

      // Remove deleted images
      if (removedImageIds.length > 0) {
        await supabase.from('product_images').delete().in('id', removedImageIds);
      }

      // Upload new images
      for (let i = 0; i < newImages.length; i++) {
        const file = newImages[i];
        const ext = file.name.split('.').pop();
        const path = `products/${productId}/${Date.now()}-${i}.${ext}`;

        const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file);
        if (uploadError) continue;

        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
        if (urlData?.publicUrl) {
          await supabase.from('product_images').insert({
            product_id: productId,
            url: urlData.publicUrl,
            alt_text: nameAr,
            sort_order: existingImages.length + i,
            is_primary: existingImages.length === 0 && i === 0,
          });
        }
      }

      // Update variations: delete all, re-insert
      await supabase.from('product_variations').delete().eq('product_id', productId);
      for (const v of variations) {
        if (!v.value.trim()) continue;
        await supabase.from('product_variations').insert({
          product_id: productId,
          variation_type: v.type,
          variation_value: v.value.trim(),
          sku: v.sku.trim() || null,
          price_override: v.price_override ? Number(v.price_override) : null,
          stock_quantity: v.stock_quantity ? Number(v.stock_quantity) : null,
        });
      }

      toast.success(locale === 'ar' ? 'تم تحديث المنتج بنجاح' : 'Product updated successfully');
      router.push('/supplier/products');
    } catch (err) {
      console.error('Failed to update product:', err);
      toast.error(locale === 'ar' ? 'فشل تحديث المنتج' : 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/supplier/products"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{locale === 'ar' ? 'تعديل المنتج' : 'Edit Product'}</h1>
          <p className="text-muted-foreground text-sm mt-1">{nameAr}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{locale === 'ar' ? 'المعلومات الأساسية' : 'Basic Information'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{locale === 'ar' ? 'اسم المنتج (عربي)' : 'Product Name (Arabic)'} *</Label>
                <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} className={errors.nameAr ? 'border-red-500' : ''} />
                {errors.nameAr && <p className="text-xs text-red-500">{errors.nameAr}</p>}
              </div>
              <div className="space-y-2">
                <Label>{locale === 'ar' ? 'اسم المنتج (إنجليزي)' : 'Product Name (English)'}</Label>
                <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} dir="ltr" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{locale === 'ar' ? 'الوصف (عربي)' : 'Description (Arabic)'}</Label>
                <Textarea value={descAr} onChange={(e) => setDescAr(e.target.value)} rows={4} />
              </div>
              <div className="space-y-2">
                <Label>{locale === 'ar' ? 'الوصف (إنجليزي)' : 'Description (English)'}</Label>
                <Textarea value={descEn} onChange={(e) => setDescEn(e.target.value)} rows={4} dir="ltr" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category & Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{locale === 'ar' ? 'التصنيف والتسعير' : 'Category & Pricing'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{locale === 'ar' ? 'التصنيف' : 'Category'} *</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                    <SelectValue placeholder={locale === 'ar' ? 'اختر التصنيف' : 'Select category'} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{locale === 'ar' ? c.name : c.name_en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
              </div>
              <div className="space-y-2">
                <Label>{locale === 'ar' ? 'التصنيف الفرعي' : 'Subcategory'}</Label>
                <Select value={subcategoryId} onValueChange={setSubcategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder={locale === 'ar' ? 'اختر التصنيف الفرعي' : 'Select subcategory'} />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategories.map(s => (
                      <SelectItem key={s.id} value={s.id}>{locale === 'ar' ? s.name : s.name_en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>{locale === 'ar' ? 'السعر' : 'Price'} *</Label>
                <Input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} dir="ltr" className={errors.price ? 'border-red-500' : ''} />
                {errors.price && <p className="text-xs text-red-500">{errors.price}</p>}
              </div>
              <div className="space-y-2">
                <Label>{locale === 'ar' ? 'العملة' : 'Currency'}</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DZD">DZD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{locale === 'ar' ? 'الحد الأدنى للطلب' : 'Min Order'}</Label>
                <Input type="number" min="1" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>{locale === 'ar' ? 'الوحدة' : 'Unit'}</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map(u => (
                      <SelectItem key={u.value} value={u.value}>{locale === 'ar' ? u.ar : u.en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{locale === 'ar' ? 'كمية المخزون' : 'Stock Quantity'}</Label>
                <Input type="number" min="0" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>{locale === 'ar' ? 'الحالة' : 'Status'}</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{locale === 'ar' ? 'نشط' : 'Active'}</SelectItem>
                    <SelectItem value="draft">{locale === 'ar' ? 'مسودة' : 'Draft'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{locale === 'ar' ? 'صور المنتج' : 'Product Images'}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Existing images */}
            {existingImages.length > 0 && (
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-4">
                {existingImages.map(img => (
                  <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden border">
                    <Image src={img.url} alt="" fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(img.id)}
                      className="absolute top-1 end-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {img.is_primary && (
                      <span className="absolute bottom-1 inset-x-0 text-center text-[10px] bg-navy/80 text-white py-0.5">
                        {locale === 'ar' ? 'رئيسية' : 'Primary'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* New images upload */}
            {(existingImages.length + newImages.length) < 5 && (
              <div className="border-2 border-dashed border-muted rounded-xl p-6 text-center">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm">{locale === 'ar' ? 'اسحب الصور أو انقر للرفع' : 'Drag images or click to upload'}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {locale === 'ar' ? `يمكنك إضافة ${5 - existingImages.length - newImages.length} صور أخرى` : `You can add ${5 - existingImages.length - newImages.length} more images`}
                </p>
                <input type="file" accept="image/*" multiple onChange={handleNewImageUpload} className="hidden" id="edit-image-upload" />
                <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => document.getElementById('edit-image-upload')?.click()}>
                  <Upload className="w-4 h-4 me-2" />
                  {locale === 'ar' ? 'اختر صور' : 'Choose Images'}
                </Button>
              </div>
            )}

            {/* New image previews */}
            {newImagePreviews.length > 0 && (
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mt-4">
                {newImagePreviews.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-dashed border-navy/30">
                    <Image src={src} alt="" fill className="object-cover" />
                    <button type="button" onClick={() => removeNewImage(i)} className="absolute top-1 end-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600">
                      <X className="w-3 h-3" />
                    </button>
                    <span className="absolute bottom-1 inset-x-0 text-center text-[10px] bg-gold/80 text-white py-0.5">
                      {locale === 'ar' ? 'جديد' : 'New'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Variations */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{locale === 'ar' ? 'متغيرات المنتج' : 'Product Variations'}</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addVariation}>
                <Plus className="w-4 h-4 me-2" />
                {locale === 'ar' ? 'إضافة متغير' : 'Add Variation'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {variations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                {locale === 'ar' ? 'لا توجد متغيرات' : 'No variations'}
              </p>
            ) : (
              <div className="space-y-3">
                {variations.map((v, i) => (
                  <div key={i} className="flex flex-col sm:flex-row gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-full sm:w-32">
                      <Select value={v.type} onValueChange={(val) => updateVariation(i, 'type', val)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {VARIATION_TYPES.map(t => (
                            <SelectItem key={t.value} value={t.value}>{locale === 'ar' ? t.ar : t.en}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input placeholder={locale === 'ar' ? 'القيمة' : 'Value'} value={v.value} onChange={(e) => updateVariation(i, 'value', e.target.value)} className="flex-1" />
                    <Input placeholder="SKU" value={v.sku} onChange={(e) => updateVariation(i, 'sku', e.target.value)} className="w-full sm:w-32" dir="ltr" />
                    <Input type="number" placeholder={locale === 'ar' ? 'سعر إضافي' : 'Price Override'} value={v.price_override} onChange={(e) => updateVariation(i, 'price_override', e.target.value)} className="w-full sm:w-32" dir="ltr" />
                    <Input type="number" placeholder={locale === 'ar' ? 'المخزون' : 'Stock'} value={v.stock_quantity} onChange={(e) => updateVariation(i, 'stock_quantity', e.target.value)} className="w-full sm:w-28" dir="ltr" />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeVariation(i)} className="text-red-500 shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center gap-3 justify-end">
          <Button type="button" variant="outline" asChild>
            <Link href="/supplier/products">{locale === 'ar' ? 'إلغاء' : 'Cancel'}</Link>
          </Button>
          <Button type="submit" disabled={loading} className="bg-navy hover:bg-navy-light text-white min-w-32">
            {loading ? (
              <><Loader2 className="w-4 h-4 me-2 animate-spin" />{locale === 'ar' ? 'جارٍ الحفظ...' : 'Saving...'}</>
            ) : (
              locale === 'ar' ? 'حفظ التغييرات' : 'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
