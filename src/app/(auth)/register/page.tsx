'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/lib/auth-context';
import { useLocaleStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { SUPPLIER_CATEGORIES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Loader2,
  Building2,
  Phone,
  ShoppingCart,
  Factory,
  ArrowLeft,
  Globe,
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================
// Zod Schemas
// ============================================

const baseRegisterSchema = z.object({
  displayName: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  email: z.string().min(1, 'البريد الإلكتروني مطلوب').email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  confirmPassword: z.string().min(1, 'تأكيد كلمة المرور مطلوب'),
});

const buyerSchema = baseRegisterSchema.refine(
  (data) => data.password === data.confirmPassword,
  { message: 'كلمات المرور غير متطابقة', path: ['confirmPassword'] }
);

const supplierSchema = baseRegisterSchema
  .extend({
    companyName: z.string().min(2, 'اسم الشركة يجب أن يكون حرفين على الأقل'),
    phone: z.string().min(8, 'رقم الهاتف غير صالح'),
    category: z.string().min(1, 'يرجى اختيار التصنيف'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'كلمات المرور غير متطابقة',
    path: ['confirmPassword'],
  });

type BuyerForm = z.infer<typeof buyerSchema>;
type SupplierForm = z.infer<typeof supplierSchema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'buyer' | 'supplier'>('buyer');
  const [categoryValue, setCategoryValue] = useState('');
  const { signUp } = useAuth();
  const router = useRouter();
  const { locale } = useLocaleStore();
  const t = getTranslation(locale);

  // Buyer form
  const buyerForm = useForm<BuyerForm>({
    resolver: zodResolver(buyerSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Supplier form
  const supplierForm = useForm<SupplierForm>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
      companyName: '',
      phone: '',
      category: '',
    },
  });

  const onBuyerSubmit = async (data: BuyerForm) => {
    await handleRegister({
      ...data,
      companyName: '',
      phone: '',
      category: '',
    }, 'user');
  };

  const onSupplierSubmit = async (data: SupplierForm) => {
    await handleRegister(data, 'supplier');
  };

  const handleRegister = async (
    data: BuyerForm | SupplierForm,
    role: 'user' | 'supplier'
  ) => {
    setLoading(true);

    const username = data.email.split('@')[0] + Date.now().toString().slice(-4);

    const supplierProfile =
      role === 'supplier' && 'companyName' in data && data.companyName
        ? {
            name: data.companyName,
            nameEn: data.companyName,
            description: '',
            descriptionEn: '',
            category: data.category || 'construction',
            logoUrl: `https://placehold.co/200x200/1B3A5C/white?text=${encodeURIComponent(data.companyName.charAt(0))}`,
            coverUrl: 'https://placehold.co/1200x400/1B3A5C/white?text=BUSINFO',
            address: '',
            addressEn: '',
            contact: {
              phone: 'phone' in data ? data.phone : '',
              whatsapp: 'phone' in data ? data.phone : '',
              email: data.email,
            },
            badge: 'none' as const,
          }
        : undefined;

    const { error } = await signUp(
      data.email,
      data.password,
      data.displayName,
      role,
      username,
      supplierProfile
    );

    setLoading(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success(t.success.registerSuccess);
      router.push('/login');
    }
  };

  return (
    <div className="w-full max-w-lg">
      <Card className="border-0 shadow-[var(--shadow-lg)]">
        <CardHeader className="text-center pb-0">
          <CardTitle className="text-2xl font-bold text-foreground">
            {t.auth.registerTitle}
          </CardTitle>
          <CardDescription className="mt-1.5">
            {t.auth.registerSubtitle}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              setActiveTab(v as 'buyer' | 'supplier');
              buyerForm.clearErrors();
              supplierForm.clearErrors();
            }}
          >
            <TabsList className="w-full h-11 rounded-xl bg-muted/80 p-1 mb-6">
              <TabsTrigger
                value="buyer"
                className="flex-1 gap-2 rounded-lg text-sm font-medium h-9 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <ShoppingCart className="w-4 h-4" />
                {t.auth.roleUser}
              </TabsTrigger>
              <TabsTrigger
                value="supplier"
                className="flex-1 gap-2 rounded-lg text-sm font-medium h-9 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Factory className="w-4 h-4" />
                {t.auth.roleSupplier}
              </TabsTrigger>
            </TabsList>

            {/* ==================== Buyer Tab ==================== */}
            <TabsContent value="buyer">
              <form onSubmit={buyerForm.handleSubmit(onBuyerSubmit)} className="space-y-5">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="buyer-name" className="text-sm font-medium">
                    {t.auth.displayNameLabel}
                  </Label>
                  <div className="relative">
                    <User className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="buyer-name"
                      placeholder="محمد أحمد"
                      className="h-11 ps-4 pe-10 text-sm rounded-xl"
                      {...buyerForm.register('displayName')}
                    />
                  </div>
                  {buyerForm.formState.errors.displayName && (
                    <p className="text-sm text-destructive">
                      {buyerForm.formState.errors.displayName.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="buyer-email" className="text-sm font-medium">
                    {t.auth.emailLabel}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="buyer-email"
                      type="email"
                      dir="ltr"
                      placeholder="name@example.com"
                      className="h-11 ps-10 pe-10 text-sm rounded-xl"
                      {...buyerForm.register('email')}
                    />
                  </div>
                  {buyerForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {buyerForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="buyer-password" className="text-sm font-medium">
                      {t.auth.passwordLabel}
                    </Label>
                    <div className="relative">
                      <Lock className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="buyer-password"
                        type={showPassword ? 'text' : 'password'}
                        dir="ltr"
                        placeholder="6 أحرف على الأقل"
                        className="h-11 ps-10 pe-10 text-sm rounded-xl"
                        {...buyerForm.register('password')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                        aria-label="إظهار كلمة المرور"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {buyerForm.formState.errors.password && (
                      <p className="text-sm text-destructive">
                        {buyerForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="buyer-confirm" className="text-sm font-medium">
                      {t.auth.confirmPasswordLabel}
                    </Label>
                    <div className="relative">
                      <Lock className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="buyer-confirm"
                        type={showConfirmPassword ? 'text' : 'password'}
                        dir="ltr"
                        placeholder="أعد إدخال كلمة المرور"
                        className="h-11 ps-10 pe-10 text-sm rounded-xl"
                        {...buyerForm.register('confirmPassword')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                        aria-label="إظهار تأكيد كلمة المرور"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {buyerForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-destructive">
                        {buyerForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full h-11 bg-navy hover:bg-navy-light text-white font-semibold rounded-xl shadow-sm transition-colors"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin me-2" />
                      {t.common.loading}
                    </>
                  ) : (
                    <>
                      {t.auth.registerButton}
                      <ArrowLeft className="w-4 h-4 ms-2" />
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* ==================== Supplier Tab ==================== */}
            <TabsContent value="supplier">
              <form onSubmit={supplierForm.handleSubmit(onSupplierSubmit)} className="space-y-5">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="supplier-name" className="text-sm font-medium">
                    {t.auth.displayNameLabel}
                  </Label>
                  <div className="relative">
                    <User className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="supplier-name"
                      placeholder="محمد أحمد"
                      className="h-11 ps-4 pe-10 text-sm rounded-xl"
                      {...supplierForm.register('displayName')}
                    />
                  </div>
                  {supplierForm.formState.errors.displayName && (
                    <p className="text-sm text-destructive">
                      {supplierForm.formState.errors.displayName.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="supplier-email" className="text-sm font-medium">
                    {t.auth.emailLabel}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="supplier-email"
                      type="email"
                      dir="ltr"
                      placeholder="name@company.com"
                      className="h-11 ps-10 pe-10 text-sm rounded-xl"
                      {...supplierForm.register('email')}
                    />
                  </div>
                  {supplierForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {supplierForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password & Confirm */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="supplier-password" className="text-sm font-medium">
                      {t.auth.passwordLabel}
                    </Label>
                    <div className="relative">
                      <Lock className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="supplier-password"
                        type={showPassword ? 'text' : 'password'}
                        dir="ltr"
                        placeholder="6 أحرف على الأقل"
                        className="h-11 ps-10 pe-10 text-sm rounded-xl"
                        {...supplierForm.register('password')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                        aria-label="إظهار كلمة المرور"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {supplierForm.formState.errors.password && (
                      <p className="text-sm text-destructive">
                        {supplierForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supplier-confirm" className="text-sm font-medium">
                      {t.auth.confirmPasswordLabel}
                    </Label>
                    <div className="relative">
                      <Lock className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="supplier-confirm"
                        type={showConfirmPassword ? 'text' : 'password'}
                        dir="ltr"
                        placeholder="أعد إدخال كلمة المرور"
                        className="h-11 ps-10 pe-10 text-sm rounded-xl"
                        {...supplierForm.register('confirmPassword')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                        aria-label="إظهار تأكيد كلمة المرور"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {supplierForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-destructive">
                        {supplierForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Company Info Section */}
                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Building2 className="w-4 h-4 text-navy" />
                    {locale === 'ar' ? 'معلومات الشركة' : 'Company Information'}
                  </div>

                  {/* Company Name */}
                  <div className="space-y-2">
                    <Label htmlFor="company-name" className="text-sm font-medium">
                      {t.auth.companyLabel}
                    </Label>
                    <div className="relative">
                      <Building2 className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="company-name"
                        placeholder={locale === 'ar' ? 'اسم الشركة' : 'Company Name'}
                        className="h-11 ps-4 pe-10 text-sm rounded-xl"
                        {...supplierForm.register('companyName')}
                      />
                    </div>
                    {supplierForm.formState.errors.companyName && (
                      <p className="text-sm text-destructive">
                        {supplierForm.formState.errors.companyName.message}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="supplier-phone" className="text-sm font-medium">
                      {t.auth.phoneLabel}
                    </Label>
                    <div className="relative">
                      <Phone className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="supplier-phone"
                        type="tel"
                        dir="ltr"
                        placeholder="+213 XXX XXX XXX"
                        className="h-11 ps-10 pe-10 text-sm rounded-xl"
                        {...supplierForm.register('phone')}
                      />
                    </div>
                    {supplierForm.formState.errors.phone && (
                      <p className="text-sm text-destructive">
                        {supplierForm.formState.errors.phone.message}
                      </p>
                    )}
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      {locale === 'ar' ? 'التصنيف' : 'Category'}
                    </Label>
                    <Select
                      value={categoryValue}
                      onValueChange={(value) => {
                        setCategoryValue(value);
                        supplierForm.setValue('category', value, {
                          shouldValidate: true,
                        });
                      }}
                    >
                      <SelectTrigger className="w-full h-11 rounded-xl text-sm">
                        <SelectValue
                          placeholder={
                            locale === 'ar' ? 'اختر التصنيف' : 'Select category'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {SUPPLIER_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.key} value={cat.key}>
                            {locale === 'ar' ? cat.labelAr : cat.labelEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {supplierForm.formState.errors.category && (
                      <p className="text-sm text-destructive">
                        {supplierForm.formState.errors.category.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full h-11 bg-navy hover:bg-navy-light text-white font-semibold rounded-xl shadow-sm transition-colors"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin me-2" />
                      {t.common.loading}
                    </>
                  ) : (
                    <>
                      {t.auth.registerButton}
                      <ArrowLeft className="w-4 h-4 ms-2" />
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Divider */}
          <div className="my-6">
            <Separator />
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {t.auth.hasAccount}{' '}
              <Link
                href="/login"
                className="font-semibold text-navy hover:text-navy-light transition-colors"
              >
                {t.auth.loginButton}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
