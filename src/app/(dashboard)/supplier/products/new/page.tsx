'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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

export default function CreateProduct() {
  const router = useRouter();
  const { locale } = useLocaleStore();
  const { supplier } = useAuth();
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
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const { data } = await supabase.from('categories').select('id, name, name_en').eq('is_active', true);
    setCategories((data || []).map(c => ({ id: c.id, name: c.name, name_en: c.name_en })));
  };

  const loadSubcategories = useCallback(async (catId: string) => {
    if (!catId) { setSubcategories([]); setSubcategoryId(''); return; }
    const { data } = await supabase.from('subcategories').select('id, name, name_en').eq('category_id', catId).eq('is_active', true);
    setSubcategories((data || []).map(s => ({ id: s.id, name: s.name, name_en: s.name_en })));
  }, []);

  useEffect(() => {
    loadSubcategories(categoryId);
  }, [categoryId, loadSubcategories]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles = [...images, ...files].slice(0, 5);
    setImages(newFiles);

    const newPreviews = newFiles.map(f => URL.createObjectURL(f));
    setImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))].slice(0, 5));
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
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

      // Insert product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          supplier_id: supplier.id,
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
        })
        .select()
        .single();

      if (productError) throw productError;

      // Upload images
      if (images.length > 0 && product) {
        for (let i = 0; i < images.length; i++) {
          const file = images[i];
          const ext = file.name.split('.').pop();
          const path = `products/${product.id}/${Date.now()}-${i}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(path, file);

          if (uploadError) {
            console.error('Image upload failed:', uploadError);
            continue;
          }

          const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
          const publicUrl = urlData?.publicUrl;

          if (publicUrl) {
            await supabase.from('product_images').insert({
              product_id: product.id,
              url: publicUrl,
              alt_text: nameAr,
              sort_order: i,
              is_primary: i === 0,
            });
          }
        }
      }

      // Insert variations
      if (variations.length > 0 && product) {
        for (const v of variations) {
          if (!v.value.trim()) continue;
          await supabase.from('product_variations').insert({
            product_id: product.id,
            variation_type: v.type,
            variation_value: v.value.trim(),
            sku: v.sku.trim() || null,
            price_override: v.price_override ? Number(v.price_override) : null,
            stock_quantity: v.stock_quantity ? Number(v.stock_quantity) : null,
          });
        }
      }

      toast.success(locale === 'ar' ? 'تم إضافة المنتج بنجاح' : 'Product added successfully');
      router.push('/supplier/products');
    } catch (err) {
      console.error('Failed to create product:', err);
      toast.error(locale === 'ar' ? 'فشل إضافة المنتج' : 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/supplier/products">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{locale === 'ar' ? 'إضافة منتج جديد' : 'Add New Product'}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {locale === 'ar' ? 'أدخل تفاصيل المنتج الجديد' : 'Enter the details for the new product'}
          </p>
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
                <Label htmlFor="nameAr">{locale === 'ar' ? 'اسم المنتج (عربي)' : 'Product Name (Arabic)'} *</Label>
                <Input
                  id="nameAr"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder={locale === 'ar' ? 'أدخل اسم المنتج بالعربية' : 'Enter product name in Arabic'}
                  className={errors.nameAr ? 'border-red-500' : ''}
                />
                {errors.nameAr && <p className="text-xs text-red-500">{errors.nameAr}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameEn">{locale === 'ar' ? 'اسم المنتج (إنجليزي)' : 'Product Name (English)'}</Label>
                <Input
                  id="nameEn"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder={locale === 'ar' ? 'أدخل اسم المنتج بالإنجليزية' : 'Enter product name in English'}
                  dir="ltr"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="descAr">{locale === 'ar' ? 'الوصف (عربي)' : 'Description (Arabic)'}</Label>
                <Textarea
                  id="descAr"
                  value={descAr}
                  onChange={(e) => setDescAr(e.target.value)}
                  placeholder={locale === 'ar' ? 'أدخل وصف المنتج' : 'Enter product description'}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descEn">{locale === 'ar' ? 'الوصف (إنجليزي)' : 'Description (English)'}</Label>
                <Textarea
                  id="descEn"
                  value={descEn}
                  onChange={(e) => setDescEn(e.target.value)}
                  placeholder={locale === 'ar' ? 'أدخل وصف المنتج بالإنجليزية' : 'Enter product description in English'}
                  rows={4}
                  dir="ltr"
                />
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
                <Label htmlFor="price">{locale === 'ar' ? 'السعر' : 'Price'} *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  dir="ltr"
                  className={errors.price ? 'border-red-500' : ''}
                />
                {errors.price && <p className="text-xs text-red-500">{errors.price}</p>}
              </div>
              <div className="space-y-2">
                <Label>{locale === 'ar' ? 'العملة' : 'Currency'}</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DZD">DZD (د.ج)</SelectItem>
                    <SelectItem value="EUR">EUR (&#8364;)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="minOrder">{locale === 'ar' ? 'الحد الأدنى للطلب' : 'Min Order'}</Label>
                <Input
                  id="minOrder"
                  type="number"
                  min="1"
                  value={minOrder}
                  onChange={(e) => setMinOrder(e.target.value)}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>{locale === 'ar' ? 'الوحدة' : 'Unit'}</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                <Label htmlFor="stock">{locale === 'ar' ? 'كمية المخزون' : 'Stock Quantity'}</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  placeholder={locale === 'ar' ? 'اتركه فارغاً للتوفر الدائم' : 'Leave empty for always available'}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>{locale === 'ar' ? 'الحالة' : 'Status'}</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
            <div className="border-2 border-dashed border-muted rounded-xl p-8 text-center hover:border-navy/50 transition-colors">
              <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium">{locale === 'ar' ? 'اسحب الصور هنا أو انقر للرفع' : 'Drag images here or click to upload'}</p>
              <p className="text-xs text-muted-foreground mt-1">{locale === 'ar' ? 'PNG, JPG حتى 5 ميجا - حد أقصى 5 صور' : 'PNG, JPG up to 5MB - Max 5 images'}</p>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => document.getElementById('image-upload')?.click()}
              >
                <Upload className="w-4 h-4 me-2" />
                {locale === 'ar' ? 'اختر صور' : 'Choose Images'}
              </Button>
            </div>
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mt-4">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden border">
                    <Image src={src} alt="" fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 end-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-1 inset-x-0 text-center text-[10px] bg-navy/80 text-white py-0.5">
                        {locale === 'ar' ? 'رئيسية' : 'Primary'}
                      </span>
                    )}
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
                {locale === 'ar' ? 'لم تتم إضافة متغيرات. أضف متغيرات مثل الحجم واللون.' : 'No variations added. Add variations like size and color.'}
              </p>
            ) : (
              <div className="space-y-3">
                {variations.map((v, i) => (
                  <div key={i} className="flex flex-col sm:flex-row gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-full sm:w-32">
                      <Select value={v.type} onValueChange={(val) => updateVariation(i, 'type', val)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {VARIATION_TYPES.map(t => (
                            <SelectItem key={t.value} value={t.value}>{locale === 'ar' ? t.ar : t.en}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      placeholder={locale === 'ar' ? 'القيمة (مثلاً: أحمر)' : 'Value (e.g. Red)'}
                      value={v.value}
                      onChange={(e) => updateVariation(i, 'value', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="SKU"
                      value={v.sku}
                      onChange={(e) => updateVariation(i, 'sku', e.target.value)}
                      className="w-full sm:w-32"
                      dir="ltr"
                    />
                    <Input
                      type="number"
                      placeholder={locale === 'ar' ? 'سعر إضافي' : 'Price Override'}
                      value={v.price_override}
                      onChange={(e) => updateVariation(i, 'price_override', e.target.value)}
                      className="w-full sm:w-32"
                      dir="ltr"
                    />
                    <Input
                      type="number"
                      placeholder={locale === 'ar' ? 'المخزون' : 'Stock'}
                      value={v.stock_quantity}
                      onChange={(e) => updateVariation(i, 'stock_quantity', e.target.value)}
                      className="w-full sm:w-28"
                      dir="ltr"
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeVariation(i)} className="text-red-500 hover:text-red-700 shrink-0">
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
              <>
                <Loader2 className="w-4 h-4 me-2 animate-spin" />
                {locale === 'ar' ? 'جارٍ الحفظ...' : 'Saving...'}
              </>
            ) : (
              locale === 'ar' ? 'حفظ المنتج' : 'Save Product'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
