'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Settings, Globe, Palette, Mail, Bell, Save, Upload, Loader2,
  ImageIcon, FileText, Phone, MapPin, Building2, Shield,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSettings() {
  const { profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // General Settings
  const [platformName, setPlatformName] = useState('بزنس إنفو');
  const [platformNameEn, setPlatformNameEn] = useState('BUSINFO');
  const [platformDescription, setPlatformDescription] = useState('منصة بزنس إنفو لربط الموردين والشركات الكبرى');
  const [contactEmail, setContactEmail] = useState('info@businfo.dz');
  const [contactPhone, setContactPhone] = useState('+213 21 000 000');
  const [address, setAddress] = useState('العاصمة، الجزائر');

  // Appearance
  const [primaryColor, setPrimaryColor] = useState('#1B3A5C');

  // Email
  const [smtpHost, setSmtpHost] = useState('smtp.businfo.dz');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('noreply@businfo.dz');

  // Notifications
  const [notifyNewUser, setNotifyNewUser] = useState(true);
  const [notifyNewSupplier, setNotifyNewSupplier] = useState(true);
  const [notifyNewOrder, setNotifyNewOrder] = useState(true);
  const [notifyBadgeRequest, setNotifyBadgeRequest] = useState(true);
  const [notifyAdRequest, setNotifyAdRequest] = useState(true);
  const [notifyNewMessage, setNotifyNewMessage] = useState(false);
  const [notifyReview, setNotifyReview] = useState(false);
  const [notifySystemError, setNotifySystemError] = useState(true);

  const isAdmin = !authLoading && profile?.role === 'admin';
  const loading = authLoading || !isAdmin;

  const handleSave = (section: string) => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success(`تم حفظ إعدادات ${section} بنجاح`);
    }, 1000);
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#1B3A5C]" />
          إعدادات المنصة
        </h1>
        <p className="text-sm text-gray-500">إدارة إعدادات النظام والمنصة</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="general" className="gap-1.5">
            <Globe className="w-3.5 h-3.5" /> عام
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-1.5">
            <Palette className="w-3.5 h-3.5" /> المظهر
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-1.5">
            <Mail className="w-3.5 h-3.5" /> البريد
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5">
            <Bell className="w-3.5 h-3.5" /> الإشعارات
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">إعدادات عامة</CardTitle>
              <CardDescription>المعلومات الأساسية للمنصة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">اسم المنصة (عربي)</Label>
                  <div className="relative">
                    <Globe className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input value={platformName} onChange={(e) => setPlatformName(e.target.value)} className="pr-10" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">اسم المنصة (إنجليزي)</Label>
                  <div className="relative">
                    <Globe className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input value={platformNameEn} onChange={(e) => setPlatformNameEn(e.target.value)} className="pr-10" dir="ltr" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">وصف المنصة</Label>
                <Textarea
                  value={platformDescription}
                  onChange={(e) => setPlatformDescription(e.target.value)}
                  rows={2}
                />
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  معلومات التواصل
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">البريد الإلكتروني</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="pr-10" dir="ltr" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">رقم الهاتف</Label>
                    <div className="relative">
                      <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="pr-10" dir="ltr" />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5 mt-4">
                  <Label className="text-xs font-medium">العنوان</Label>
                  <div className="relative">
                    <MapPin className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                    <Textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={2}
                      className="pr-10"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={() => handleSave('العامة')} disabled={saving} className="gap-1.5 min-w-24">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'جارٍ الحفظ...' : 'حفظ'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">إعدادات المظهر</CardTitle>
              <CardDescription>تخصيص مظهر المنصة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">اللون الأساسي</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-12 h-10 rounded-lg cursor-pointer border-0"
                  />
                  <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-40" dir="ltr" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">معاينة:</span>
                    <div className="h-8 w-16 rounded-lg" style={{ backgroundColor: primaryColor }} />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">شعار المنصة</Label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Upload className="w-3.5 h-3.5" /> رفع شعار
                    </Button>
                    <p className="text-[11px] text-gray-400">PNG, JPG - الحد الأقصى 2MB</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">أيقونة الموقع (Favicon)</Label>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Upload className="w-3.5 h-3.5" /> رفع أيقونة
                    </Button>
                    <p className="text-[11px] text-gray-400">ICO, PNG - 32x32px أو 64x64px</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={() => handleSave('المظهر')} disabled={saving} className="gap-1.5 min-w-24">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'جارٍ الحفظ...' : 'حفظ'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">إعدادات SMTP</CardTitle>
              <CardDescription>إعدادات خادم البريد الإلكتروني</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">SMTP Host</Label>
                  <Input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} dir="ltr" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">SMTP Port</Label>
                  <Input value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} dir="ltr" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">SMTP User</Label>
                  <Input value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} dir="ltr" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">كلمة المرور</Label>
                <Input type="password" value="••••••••••" readOnly className="bg-gray-50" dir="ltr" />
                <p className="text-[11px] text-gray-400">لأسباب أمنية، لا يمكن عرض كلمة المرور المخزنة</p>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={() => handleSave('البريد')} disabled={saving} className="gap-1.5 min-w-24">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'جارٍ الحفظ...' : 'حفظ'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">قوالب البريد الإلكتروني</CardTitle>
              <CardDescription>قوالب الرسائل المرسلة تلقائياً</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {[
                  { name: 'مرحباً بك', desc: 'رسالة ترحيب عند تسجيل حساب جديد', type: 'ترحيب' },
                  { name: 'تأكيد الطلب', desc: 'إشعار تأكيد عند إتمام طلب', type: 'طلب' },
                  { name: 'إعادة تعيين كلمة المرور', desc: 'رابط إعادة تعيين كلمة المرور', type: 'أمان' },
                  { name: 'موافقة الشارة', desc: 'إشعار عند الموافقة على طلب الشارة', type: 'شارة' },
                  { name: 'تفعيل الإعلان', desc: 'إشعار عند تفعيل الإعلان', type: 'إعلان' },
                  { name: 'رسالة جديدة', desc: 'إشعار عند استلام رسالة جديدة', type: 'رسالة' },
                ].map((template, idx) => (
                  <div key={idx} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{template.name}</p>
                        <p className="text-xs text-gray-400">{template.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[11px]">{template.type}</Badge>
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        تعديل
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">إعدادات الإشعارات</CardTitle>
              <CardDescription>تحكم في أنواع الإشعارات المرسلة للمسؤولين</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {[
                { label: 'تسجيل مستخدم جديد', desc: 'إشعار عند تسجيل مستخدم جديد', value: notifyNewUser, setter: setNotifyNewUser },
                { label: 'طلب مورد جديد', desc: 'إشعار عند تسجيل مورد جديد', value: notifyNewSupplier, setter: setNotifyNewSupplier },
                { label: 'طلب جديد', desc: 'إشعار عند إنشاء طلب جديد', value: notifyNewOrder, setter: setNotifyNewOrder },
                { label: 'طلب شارة', desc: 'إشعار عند تقديم طلب شارة', value: notifyBadgeRequest, setter: setNotifyBadgeRequest },
                { label: 'طلب إعلان', desc: 'إشعار عند تقديم طلب إعلان', value: notifyAdRequest, setter: setNotifyAdRequest },
                { label: 'رسالة جديدة', desc: 'إشعار عند استلام رسالة جديدة', value: notifyNewMessage, setter: setNotifyNewMessage },
                { label: 'تقييم جديد', desc: 'إشعار عند إضافة تقييم جديد', value: notifyReview, setter: setNotifyReview },
                { label: 'خطأ في النظام', desc: 'إشعار عند حدوث خطأ في النظام', value: notifySystemError, setter: setNotifySystemError },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Bell className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.label}</p>
                      <p className="text-xs text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                  <Switch
                    checked={item.value}
                    onCheckedChange={item.setter}
                  />
                </div>
              ))}
            </CardContent>
            <div className="border-t px-6 py-4 flex justify-end">
              <Button onClick={() => handleSave('الإشعارات')} disabled={saving} className="gap-1.5 min-w-24">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'جارٍ الحفظ...' : 'حفظ'}
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
