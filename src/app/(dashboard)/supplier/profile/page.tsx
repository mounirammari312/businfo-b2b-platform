'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useLocaleStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { getInitials } from '@/lib/utils';
import {
  User,
  Mail,
  Phone,
  Camera,
  Loader2,
  Save,
  Shield,
  Calendar,
  Globe,
  Store,
} from 'lucide-react';

export default function Profile() {
  const { locale } = useLocaleStore();
  const { user, profile, supplier, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [localePref, setLocalePref] = useState<string>('ar');
  const [currencyPref, setCurrencyPref] = useState<string>('DZD');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setUsername(profile.username || '');
      setPhone('');
      setAvatarUrl(profile.avatar_url || '');
      setAvatarPreview(profile.avatar_url || '');
      setLocalePref(profile.locale || 'ar');
      setCurrencyPref(profile.currency || 'DZD');
    }
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `avatars/${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
      if (urlData?.publicUrl) {
        setAvatarUrl(urlData.publicUrl);
        setAvatarPreview(URL.createObjectURL(file));

        await supabase.from('profiles').update({
          avatar_url: urlData.publicUrl,
          updated_at: new Date().toISOString(),
        }).eq('id', user.id);

        toast.success(locale === 'ar' ? 'تم تحديث الصورة' : 'Avatar updated');
        refreshProfile();
      }
    } catch (err) {
      toast.error(locale === 'ar' ? 'فشل رفع الصورة' : 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    if (!displayName.trim()) {
      toast.error(locale === 'ar' ? 'الاسم مطلوب' : 'Name is required');
      return;
    }
    if (username.trim().length < 3) {
      toast.error(locale === 'ar' ? 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل' : 'Username must be at least 3 characters');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim(),
          username: username.trim(),
          phone: phone.trim() || null,
          locale: localePref,
          currency: currencyPref,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success(locale === 'ar' ? 'تم تحديث الملف الشخصي' : 'Profile updated successfully');
      refreshProfile();
    } catch (err: unknown) {
      const errorMessage = (err as { message?: string })?.message || '';
      if (errorMessage.includes('username') || errorMessage.includes('unique')) {
        toast.error(locale === 'ar' ? 'اسم المستخدم مستخدم بالفعل' : 'Username is already taken');
      } else {
        toast.error(locale === 'ar' ? 'فشل تحديث الملف الشخصي' : 'Failed to update profile');
      }
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">{locale === 'ar' ? 'الملف الشخصي' : 'Profile'}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {locale === 'ar' ? 'إدارة حسابك ومعلوماتك الشخصية' : 'Manage your account and personal information'}
        </p>
      </div>

      {/* Avatar Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={avatarPreview} />
                <AvatarFallback className="bg-navy text-white text-xl font-bold">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 end-0 w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center cursor-pointer hover:bg-navy-light transition-colors shadow-md">
                {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>
            <div>
              <h2 className="font-bold text-lg">{displayName}</h2>
              <p className="text-sm text-muted-foreground">@{username}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-navy/10 text-navy font-medium">
                  {profile.role === 'supplier' ? (locale === 'ar' ? 'مورد' : 'Supplier') : (locale === 'ar' ? 'مشتري' : 'Buyer')}
                </span>
                {supplier?.isVerified && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                    {locale === 'ar' ? 'معتمد' : 'Verified'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{locale === 'ar' ? 'المعلومات الشخصية' : 'Personal Information'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><User className="w-4 h-4" />{locale === 'ar' ? 'الاسم الكامل' : 'Full Name'} *</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={locale === 'ar' ? 'الاسم الكامل' : 'Full name'} />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Globe className="w-4 h-4" />{locale === 'ar' ? 'اسم المستخدم' : 'Username'} *</Label>
            <div className="relative">
              <span className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                placeholder="username"
                className="ps-8"
                dir="ltr"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Mail className="w-4 h-4" />{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
            <Input value={user?.email || ''} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">{locale === 'ar' ? 'لا يمكن تغيير البريد الإلكتروني' : 'Email cannot be changed'}</p>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Phone className="w-4 h-4" />{locale === 'ar' ? 'رقم الهاتف' : 'Phone'}</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+213..." dir="ltr" />
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{locale === 'ar' ? 'التفضيلات' : 'Preferences'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{locale === 'ar' ? 'اللغة' : 'Language'}</Label>
              <select
                value={localePref}
                onChange={(e) => setLocalePref(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="ar">{locale === 'ar' ? 'العربية' : 'Arabic'}</option>
                <option value="fr">Francais</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>{locale === 'ar' ? 'العملة' : 'Currency'}</Label>
              <select
                value={currencyPref}
                onChange={(e) => setCurrencyPref(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="DZD">DZD ({locale === 'ar' ? 'دينار جزائري' : 'Algerian Dinar'})</option>
                <option value="EUR">EUR (Euro)</option>
                <option value="USD">USD (US Dollar)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Details */}
      {supplier && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{locale === 'ar' ? 'معلومات المتجر' : 'Store Details'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{locale === 'ar' ? 'اسم المتجر' : 'Store Name'}</span>
              <a href="/supplier/store-settings" onClick={(e) => { e.preventDefault(); window.location.href = '/supplier/store-settings'; }} className="text-navy hover:underline font-medium flex items-center gap-1">
                {supplier.name}
                <Store className="w-3.5 h-3.5" />
              </a>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{locale === 'ar' ? 'تاريخ الانضمام' : 'Joined'}</span>
              <span className="font-medium">{new Date(supplier.joinedDate).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'fr-DZ')}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{locale === 'ar' ? 'الحالة' : 'Status'}</span>
              <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', supplier.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800')}>
                {supplier.status === 'active' ? (locale === 'ar' ? 'نشط' : 'Active') : (locale === 'ar' ? 'قيد المراجعة' : 'Pending')}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-navy hover:bg-navy-light text-white min-w-40">
          {saving ? (
            <><Loader2 className="w-4 h-4 me-2 animate-spin" />{locale === 'ar' ? 'جارٍ الحفظ...' : 'Saving...'}</>
          ) : (
            <><Save className="w-4 h-4 me-2" />{locale === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}</>
          )}
        </Button>
      </div>
    </div>
  );
}


