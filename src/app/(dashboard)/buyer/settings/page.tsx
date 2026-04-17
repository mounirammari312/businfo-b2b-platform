'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLocaleStore, useCurrencyStore, type Currency } from '@/lib/store';
import { cn, getInitials } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  User,
  Lock,
  Bell,
  Globe,
  Save,
  Camera,
  Phone,
  Mail,
  Loader2,
  Shield,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function BuyerSettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const { locale, setLocale } = useLocaleStore();
  const { currency, setCurrency } = useCurrencyStore();

  // Profile form
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);
  const [orderNotifications, setOrderNotifications] = useState(true);
  const [quoteNotifications, setQuoteNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);

  // Loading state
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setPhone((profile as unknown as { phone?: string }).phone || '');
      setInitialLoading(false);
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          phone: phone || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
      await refreshProfile();
      toast.success(locale === 'ar' ? 'تم تحديث الملف الشخصي بنجاح' : 'Profil mis a jour');
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error(locale === 'ar' ? 'حدث خطأ أثناء التحديث' : 'Erreur lors de la mise a jour');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;

    if (newPassword.length < 8) {
      toast.error(locale === 'ar' ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Le mot de passe doit contenir au moins 8 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(locale === 'ar' ? 'كلمات المرور غير متطابقة' : 'Les mots de passe ne correspondent pas');
      return;
    }

    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success(locale === 'ar' ? 'تم تغيير كلمة المرور بنجاح' : 'Mot de passe modifie');
    } catch (err) {
      console.error('Error changing password:', err);
      toast.error(locale === 'ar' ? 'حدث خطأ أثناء تغيير كلمة المرور' : 'Erreur de modification');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error(locale === 'ar' ? 'نوع الملف غير مدعوم' : 'Type de fichier non supporte');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error(locale === 'ar' ? 'حجم الملف يتجاوز 2 ميجابايت' : 'Le fichier depasse 2 Mo');
      return;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `avatars/${user.id}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('profiles').getPublicUrl(filePath);
      const avatarUrl = urlData.publicUrl;

      await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', user.id);
      await refreshProfile();
      toast.success(locale === 'ar' ? 'تم تحديث الصورة الشخصية' : 'Photo de profil mise a jour');
    } catch (err) {
      console.error('Error uploading avatar:', err);
      toast.error(locale === 'ar' ? 'فشل في رفع الصورة' : 'Echec du telechargement');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">
          {locale === 'ar' ? 'الإعدادات' : 'Parametres'}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {locale === 'ar' ? 'إدارة حسابك وتفضيلاتك' : 'Gerez votre compte et vos preferences'}
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-muted/50 w-full sm:w-auto">
          <TabsTrigger value="profile" className="text-sm">
            <User className="w-4 h-4 me-1.5" />
            {locale === 'ar' ? 'الملف الشخصي' : 'Profil'}
          </TabsTrigger>
          <TabsTrigger value="account" className="text-sm">
            <Lock className="w-4 h-4 me-1.5" />
            {locale === 'ar' ? 'الحساب' : 'Compte'}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-sm">
            <Bell className="w-4 h-4 me-1.5" />
            {locale === 'ar' ? 'الإشعارات' : 'Notifications'}
          </TabsTrigger>
          <TabsTrigger value="language" className="text-sm">
            <Globe className="w-4 h-4 me-1.5" />
            {locale === 'ar' ? 'اللغة والعملة' : 'Langue & Devise'}
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">{locale === 'ar' ? 'المعلومات الشخصية' : 'Informations personnelles'}</CardTitle>
              <CardDescription>
                {locale === 'ar' ? 'تحديث معلوماتك الشخصية وصورتك' : 'Mettez a jour vos informations personnelles'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {initialLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-20 rounded-full mx-auto" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <>
                  {/* Avatar */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <Avatar className="w-20 h-20 border-4 border-background shadow-md">
                        <AvatarImage src={(profile as unknown as { avatar_url?: string })?.avatar_url} />
                        <AvatarFallback className="bg-navy/10 text-xl text-navy font-semibold">
                          {getInitials(profile?.displayName || 'U')}
                        </AvatarFallback>
                      </Avatar>
                      <label className="absolute bottom-0 end-0 w-7 h-7 bg-navy rounded-full flex items-center justify-center cursor-pointer hover:bg-navy-light transition-colors shadow-md">
                        <Camera className="w-3.5 h-3.5 text-white" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {locale === 'ar' ? 'JPG, PNG أو WebP - حد أقصى 2 ميجابايت' : 'JPG, PNG ou WebP - Max 2 Mo'}
                    </p>
                  </div>

                  <Separator />

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        {locale === 'ar' ? 'الاسم الكامل' : 'Nom complet'}
                      </Label>
                      <Input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder={locale === 'ar' ? 'أدخل اسمك الكامل' : 'Votre nom complet'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" />
                        {locale === 'ar' ? 'البريد الإلكتروني' : 'E-mail'}
                      </Label>
                      <Input
                        value={profile?.email || user?.email || ''}
                        disabled
                        className="bg-muted/50"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        {locale === 'ar' ? 'لا يمكن تغيير البريد الإلكتروني' : 'L\'e-mail ne peut pas etre modifie'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" />
                        {locale === 'ar' ? 'رقم الهاتف' : 'Telephone'}
                      </Label>
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder={locale === 'ar' ? '+213 XXX XXX XXX' : '+213 XXX XXX XXX'}
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5" />
                        {locale === 'ar' ? 'نوع الحساب' : 'Type de compte'}
                      </Label>
                      <Input
                        value={profile?.role === 'buyer' ? (locale === 'ar' ? 'مشتري' : 'Acheteur') : profile?.role || ''}
                        disabled
                        className="bg-muted/50"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                      className="bg-navy hover:bg-navy-light text-white rounded-xl px-6"
                    >
                      {savingProfile ? (
                        <Loader2 className="w-4 h-4 me-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 me-2" />
                      )}
                      {locale === 'ar' ? 'حفظ التغييرات' : 'Enregistrer'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">{locale === 'ar' ? 'تغيير كلمة المرور' : 'Modifier le mot de passe'}</CardTitle>
              <CardDescription>
                {locale === 'ar' ? 'تأكد من استخدام كلمة مرور قوية' : 'Assurez-vous d\'utiliser un mot de passe fort'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label>{locale === 'ar' ? 'كلمة المرور الجديدة' : 'Nouveau mot de passe'}</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={locale === 'ar' ? 'أدخل كلمة المرور الجديدة' : 'Nouveau mot de passe'}
                />
              </div>
              <div className="space-y-2">
                <Label>{locale === 'ar' ? 'تأكيد كلمة المرور' : 'Confirmer le mot de passe'}</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={locale === 'ar' ? 'أعد إدخال كلمة المرور' : 'Confirmez le mot de passe'}
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleChangePassword}
                  disabled={savingPassword || !newPassword || !confirmPassword}
                  className="bg-navy hover:bg-navy-light text-white rounded-xl px-6"
                >
                  {savingPassword ? (
                    <Loader2 className="w-4 h-4 me-2 animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4 me-2" />
                  )}
                  {locale === 'ar' ? 'تحديث كلمة المرور' : 'Modifier'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">{locale === 'ar' ? 'تفضيلات الإشعارات' : 'Preferences de notifications'}</CardTitle>
              <CardDescription>
                {locale === 'ar' ? 'اختر الإشعارات التي تريد تلقيها' : 'Choisissez les notifications a recevoir'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">
                    {locale === 'ar' ? 'البريد الإلكتروني' : 'E-mail'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {locale === 'ar' ? 'تلقي إشعارات عبر البريد الإلكتروني' : 'Recevoir des notifications par e-mail'}
                  </p>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">
                    {locale === 'ar' ? 'إشعارات داخل التطبيق' : 'Notifications in-app'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {locale === 'ar' ? 'إشعارات تظهر داخل المنصة' : 'Notifications dans la plateforme'}
                  </p>
                </div>
                <Switch checked={inAppNotifications} onCheckedChange={setInAppNotifications} />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">
                    {locale === 'ar' ? 'تحديثات الطلبات' : 'Mises a jour des commandes'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {locale === 'ar' ? 'إشعار عند تغيير حالة طلبك' : 'Notification lors du changement de statut'}
                  </p>
                </div>
                <Switch checked={orderNotifications} onCheckedChange={setOrderNotifications} />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">
                    {locale === 'ar' ? 'عروض الأسعار' : 'Devis'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {locale === 'ar' ? 'إشعار عند الرد على طلب عرض سعر' : 'Notification de reponse a un devis'}
                  </p>
                </div>
                <Switch checked={quoteNotifications} onCheckedChange={setQuoteNotifications} />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">
                    {locale === 'ar' ? 'الرسائل' : 'Messages'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {locale === 'ar' ? 'إشعار عند استلام رسالة جديدة' : 'Notification de nouveau message'}
                  </p>
                </div>
                <Switch checked={messageNotifications} onCheckedChange={setMessageNotifications} />
              </div>

              <div className="flex justify-end pt-2">
                <Button className="bg-navy hover:bg-navy-light text-white rounded-xl px-6">
                  <Save className="w-4 h-4 me-2" />
                  {locale === 'ar' ? 'حفظ التفضيلات' : 'Enregistrer'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Language & Currency Tab */}
        <TabsContent value="language">
          <div className="space-y-6">
            {/* Language */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="w-5 h-5 text-navy" />
                  {locale === 'ar' ? 'اللغة' : 'Langue'}
                </CardTitle>
                <CardDescription>
                  {locale === 'ar' ? 'اختر لغة الواجهة المفضلة لديك' : 'Choisissez la langue de l\'interface'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setLocale('ar')}
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-start',
                      locale === 'ar'
                        ? 'border-navy bg-navy/5'
                        : 'border-border hover:border-navy/30'
                    )}
                  >
                    <div className="w-10 h-10 rounded-lg bg-navy/10 flex items-center justify-center shrink-0">
                      <span className="text-lg font-bold text-navy">ع</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">العربية</p>
                      <p className="text-xs text-muted-foreground">Arabic</p>
                    </div>
                    {locale === 'ar' && (
                      <div className="ms-auto">
                        <div className="w-5 h-5 rounded-full bg-navy flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </button>
                  <button
                    onClick={() => setLocale('fr')}
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-start',
                      locale === 'fr'
                        ? 'border-navy bg-navy/5'
                        : 'border-border hover:border-navy/30'
                    )}
                  >
                    <div className="w-10 h-10 rounded-lg bg-navy/10 flex items-center justify-center shrink-0">
                      <span className="text-lg font-bold text-navy">Fr</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Francais</p>
                      <p className="text-xs text-muted-foreground">French</p>
                    </div>
                    {locale === 'fr' && (
                      <div className="ms-auto">
                        <div className="w-5 h-5 rounded-full bg-navy flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Currency */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base">
                  {locale === 'ar' ? 'العملة' : 'Devise'}
                </CardTitle>
                <CardDescription>
                  {locale === 'ar' ? 'اختر العملة المعروضة للأسعار' : 'Choisissez la devise d\'affichage des prix'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(['DZD', 'EUR', 'USD'] as Currency[]).map((curr) => (
                    <button
                      key={curr}
                      onClick={() => setCurrency(curr)}
                      className={cn(
                        'flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-start',
                        currency === curr
                          ? 'border-navy bg-navy/5'
                          : 'border-border hover:border-navy/30'
                      )}
                    >
                      <div className="w-10 h-10 rounded-lg bg-navy/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-navy">
                          {curr === 'DZD' ? 'DA' : curr === 'EUR' ? '\u20ac' : '$'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{curr}</p>
                        <p className="text-xs text-muted-foreground">
                          {curr === 'DZD' ? 'دينار جزائري' : curr === 'EUR' ? 'Euro' : 'Dollar US'}
                        </p>
                      </div>
                      {currency === curr && (
                        <div className="ms-auto">
                          <div className="w-5 h-5 rounded-full bg-navy flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
