'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLocaleStore } from '@/lib/store';
import { cn } from '@/lib/utils';
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
  Store,
  Loader2,
  Upload,
  ImageIcon,
  Save,
  Phone,
  Mail,
  MapPin,
  Globe,
} from 'lucide-react';

export default function StoreSettings() {
  const { locale } = useLocaleStore();
  const { supplier, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [categories, setCategories] = useState<{ id: string; name: string; name_en: string }[]>([]);
  const [saving, setSaving] = useState(false);

  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [descAr, setDescAr] = useState('');
  const [descEn, setDescEn] = useState('');
  const [category, setCategory] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('DZ');
  const [logoUrl, setLogoUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [logoPreview, setLogoPreview] = useState('');
  const [coverPreview, setCoverPreview] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (supplier) {
      setNameAr(supplier.name || '');
      setNameEn(supplier.nameEn || '');
      setDescAr(supplier.description || '');
      setDescEn(supplier.descriptionEn || '');
      setCategory(supplier.category || '');
      setPhone(supplier.contact?.phone || '');
      setWhatsapp(supplier.contact?.whatsapp || '');
      setEmail(supplier.contact?.email || '');
      setAddress(supplier.address || '');
      setLogoUrl(supplier.logoUrl || '');
      setCoverUrl(supplier.coverUrl || '');
      setLogoPreview(supplier.logoUrl || '');
      setCoverPreview(supplier.coverUrl || '');
      setInitialLoading(false);
    }
  }, [supplier]);

  const loadCategories = async () => {
    const { data } = await supabase.from('categories').select('id, name, name_en').eq('is_active', true);
    setCategories((data || []).map(c => ({ id: c.id, name: c.name, name_en: c.name_en })));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!supplier?.id) return;
    setLoading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `suppliers/${supplier.id}/logo-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
      if (urlData?.publicUrl) {
        setLogoUrl(urlData.publicUrl);
        setLogoPreview(URL.createObjectURL(file));
      }
    } catch (err) {
      toast.error(locale === 'ar' ? 'فشل رفع الشعار' : 'Failed to upload logo');
    } finally {
      setLoading(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!supplier?.id) return;
    setLoading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `suppliers/${supplier.id}/cover-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
      if (urlData?.publicUrl) {
        setCoverUrl(urlData.publicUrl);
        setCoverPreview(URL.createObjectURL(file));
      }
    } catch (err) {
      toast.error(locale === 'ar' ? 'فشل رفع صورة الغلاف' : 'Failed to upload cover');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!supplier?.id) return;

    if (!nameAr.trim()) {
      toast.error(locale === 'ar' ? 'اسم المتجر بالعربية مطلوب' : 'Store name in Arabic is required');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('suppliers')
        .update({
          name: nameAr.trim(),
          name_en: nameEn.trim() || null,
          description: descAr.trim() || null,
          description_en: descEn.trim() || null,
          category: category || null,
          phone: phone.trim() || null,
          whatsapp: whatsapp.trim() || null,
          email: email.trim() || null,
          address: address.trim() || null,
          city: city.trim() || null,
          country: country,
          logo_url: logoUrl || null,
          cover_url: coverUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', supplier.id);

      if (error) throw error;

      toast.success(locale === 'ar' ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved successfully');
      refreshProfile();
    } catch (err) {
      console.error(err);
      toast.error(locale === 'ar' ? 'فشل حفظ الإعدادات' : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">{locale === 'ar' ? 'إعدادات المتجر' : 'Store Settings'}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {locale === 'ar' ? 'إدارة معلومات متجرك ومظهره' : 'Manage your store information and appearance'}
        </p>
      </div>

      {/* Logo & Cover */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{locale === 'ar' ? 'الشعار وصورة الغلاف' : 'Logo & Cover Image'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cover Image */}
          <div>
            <Label className="mb-2 block">{locale === 'ar' ? 'صورة الغلاف' : 'Cover Image'}</Label>
            <div className="relative w-full h-40 rounded-xl bg-muted overflow-hidden group">
              {coverPreview ? (
                <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-10 h-10 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <label className="cursor-pointer">
                  <Upload className="w-6 h-6 text-white" />
                  <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          {/* Logo */}
          <div>
            <Label className="mb-2 block">{locale === 'ar' ? 'شعار المتجر' : 'Store Logo'}</Label>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 rounded-full bg-muted overflow-hidden border-4 border-white shadow-md group">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Store className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
                  <label className="cursor-pointer">
                    <Upload className="w-5 h-5 text-white" />
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>{locale === 'ar' ? 'حجم مقترح: 200x200 بكسل' : 'Recommended: 200x200px'}</p>
                <p>{locale === 'ar' ? 'PNG, JPG حتى 2 ميجا' : 'PNG, JPG up to 2MB'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Store Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{locale === 'ar' ? 'معلومات المتجر' : 'Store Information'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{locale === 'ar' ? 'اسم المتجر (عربي)' : 'Store Name (Arabic)'} *</Label>
              <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder={locale === 'ar' ? 'اسم المتجر' : 'Store name'} />
            </div>
            <div className="space-y-2">
              <Label>{locale === 'ar' ? 'اسم المتجر (إنجليزي)' : 'Store Name (English)'}</Label>
              <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder={locale === 'ar' ? 'Store name' : 'Store name'} dir="ltr" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{locale === 'ar' ? 'الوصف (عربي)' : 'Description (Arabic)'}</Label>
              <Textarea value={descAr} onChange={(e) => setDescAr(e.target.value)} placeholder={locale === 'ar' ? 'وصف المتجر' : 'Store description'} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>{locale === 'ar' ? 'الوصف (إنجليزي)' : 'Description (English)'}</Label>
              <Textarea value={descEn} onChange={(e) => setDescEn(e.target.value)} placeholder={locale === 'ar' ? 'Store description' : 'Store description'} rows={3} dir="ltr" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{locale === 'ar' ? 'التصنيف الرئيسي' : 'Main Category'}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder={locale === 'ar' ? 'اختر التصنيف' : 'Select category'} />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{locale === 'ar' ? c.name : c.name_en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{locale === 'ar' ? 'معلومات التواصل' : 'Contact Information'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Phone className="w-4 h-4" />{locale === 'ar' ? 'الهاتف' : 'Phone'}</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+213..." dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Phone className="w-4 h-4" />{locale === 'ar' ? 'واتساب' : 'WhatsApp'}</Label>
              <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+213..." dir="ltr" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Mail className="w-4 h-4" />{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><MapPin className="w-4 h-4" />{locale === 'ar' ? 'العنوان' : 'Address'}</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder={locale === 'ar' ? 'عنوان المتجر' : 'Store address'} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><MapPin className="w-4 h-4" />{locale === 'ar' ? 'المدينة' : 'City'}</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder={locale === 'ar' ? 'المدينة' : 'City'} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Globe className="w-4 h-4" />{locale === 'ar' ? 'البلد' : 'Country'}</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DZ">{locale === 'ar' ? 'الجزائر' : 'Algeria'}</SelectItem>
                  <SelectItem value="TN">{locale === 'ar' ? 'تونس' : 'Tunisia'}</SelectItem>
                  <SelectItem value="MA">{locale === 'ar' ? 'المغرب' : 'Morocco'}</SelectItem>
                  <SelectItem value="LY">{locale === 'ar' ? 'ليبيا' : 'Libya'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-navy hover:bg-navy-light text-white min-w-40">
          {saving ? (
            <><Loader2 className="w-4 h-4 me-2 animate-spin" />{locale === 'ar' ? 'جارٍ الحفظ...' : 'Saving...'}</>
          ) : (
            <><Save className="w-4 h-4 me-2" />{locale === 'ar' ? 'حفظ الإعدادات' : 'Save Settings'}</>
          )}
        </Button>
      </div>
    </div>
  );
}
