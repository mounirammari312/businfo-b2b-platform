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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Building2,
  ShoppingCart,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().min(1, 'البريد الإلكتروني مطلوب').email('البريد الإلكتروني غير صالح'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'buyer' | 'supplier'>('buyer');
  const { signIn } = useAuth();
  const router = useRouter();
  const { locale } = useLocaleStore();
  const t = getTranslation(locale);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    const { error } = await signIn(data.email, data.password);
    setLoading(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success(t.success.loginSuccess);
      // Small delay to let auth context update
      setTimeout(() => {
        router.push('/');
      }, 300);
    }
  };

  return (
    <div className="w-full max-w-md">
      <Card className="border-0 shadow-[var(--shadow-lg)]">
        <CardHeader className="text-center pb-0">
          <CardTitle className="text-2xl font-bold text-foreground">
            {t.auth.loginTitle}
          </CardTitle>
          <CardDescription className="mt-1.5">
            {t.auth.welcomeMessage}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {/* Role Tabs */}
          <Tabs
            value={role}
            onValueChange={(v) => setRole(v as 'buyer' | 'supplier')}
            className="mb-6"
          >
            <TabsList className="w-full h-11 rounded-xl bg-muted/80 p-1">
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
                <Building2 className="w-4 h-4" />
                {t.auth.roleSupplier}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                {t.auth.emailLabel}
              </Label>
              <div className="relative">
                <Mail className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  dir="ltr"
                  placeholder="name@example.com"
                  className="h-11 ps-10 pe-10 text-sm rounded-xl"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  {t.auth.passwordLabel}
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-navy hover:text-navy-light transition-colors"
                >
                  {t.auth.forgotPassword}
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  dir="ltr"
                  placeholder="••••••••"
                  className="h-11 ps-10 pe-10 text-sm rounded-xl"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
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
                  {t.auth.loginButton}
                  <ArrowLeft className="w-4 h-4 ms-2" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6">
            <Separator />
          </div>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {t.auth.noAccount}{' '}
              <Link
                href="/register"
                className="font-semibold text-navy hover:text-navy-light transition-colors"
              >
                {t.auth.registerButton}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
