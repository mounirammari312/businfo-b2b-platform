'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/lib/supabase';
import { useLocaleStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Mail,
  Loader2,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';
import { toast } from 'sonner';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'البريد الإلكتروني مطلوب').email('البريد الإلكتروني غير صالح'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { locale } = useLocaleStore();
  const t = getTranslation(locale);
  const isRtl = locale === 'ar';

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/login`,
    });

    setLoading(false);

    if (error) {
      toast.error(
        error.message === 'Invalid email'
          ? 'البريد الإلكتروني غير صحيح'
          : error.message
      );
    } else {
      setSent(true);
      toast.success(t.success.passwordReset);
    }
  };

  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  if (sent) {
    return (
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-[var(--shadow-lg)]">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success-light mb-5">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              {locale === 'ar' ? 'تم الإرسال بنجاح' : 'Envoyé avec succès'}
            </h2>
            <p className="text-sm text-muted-foreground mb-2 leading-relaxed max-w-xs mx-auto">
              {t.auth.emailSent}
            </p>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed max-w-xs mx-auto">
              {getValues('email')}
            </p>
            <p className="text-xs text-[var(--text-secondary)] mb-6 leading-relaxed max-w-xs mx-auto">
              {t.auth.checkEmail}
            </p>
            <Button
              asChild
              className="h-11 bg-navy hover:bg-navy-light text-white font-semibold rounded-xl px-6"
            >
              <Link href="/login" className="flex items-center gap-2">
                <ArrowIcon className="w-4 h-4" />
                {t.auth.backButton}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <Card className="border-0 shadow-[var(--shadow-lg)]">
        <CardHeader className="text-center pb-0">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-navy/5 mb-4">
            <KeyRound className="w-7 h-7 text-navy" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            {t.auth.forgotTitle}
          </CardTitle>
          <CardDescription className="mt-1.5">
            {locale === 'ar'
              ? 'أدخل بريدك الإلكتروني وسنرسل لك رابطا لإعادة تعيين كلمة المرور'
              : 'Entrez votre email et nous vous enverrons un lien de réinitialisation'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="reset-email" className="text-sm font-medium">
                {t.auth.emailLabel}
              </Label>
              <div className="relative">
                <Mail className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="reset-email"
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
                  {t.auth.forgotButton}
                  <ArrowIcon className="w-4 h-4 ms-2" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6">
            <Separator />
          </div>

          {/* Back to Login */}
          <div className="text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-navy hover:text-navy-light transition-colors"
            >
              <ArrowIcon className="w-4 h-4 rotate-180" />
              {t.auth.backButton}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
