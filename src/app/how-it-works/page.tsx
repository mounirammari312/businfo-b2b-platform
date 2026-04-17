'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  User,
  Search,
  MessageSquare,
  CheckCircle,
  Building2,
  PackagePlus,
  Inbox,
  Truck,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Store,
} from 'lucide-react';

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-navy text-white py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/10 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-gold" />
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">كيف يعمل</h1>
          <p className="text-lg md:text-xl text-white/70 max-w-3xl mx-auto leading-relaxed">
            تعرّف على الخطوات البسيطة للبدء في استخدام منصة بزنس إنفو، سواء كنت
            مشترياً تبحث عن أفضل الموردين أو مورداً تريد توسيع نطاق أعمالك
          </p>
        </div>
      </section>

      {/* Buyer Steps */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-navy/5 rounded-full px-4 py-1.5 mb-4">
              <User className="w-4 h-4 text-navy" />
              <span className="text-sm font-semibold text-navy">للمشترين والشركات</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              خطوات البحث والشراء
            </h2>
            <p className="text-muted-foreground text-base max-w-2xl mx-auto">
              اتبع هذه الخطوات الأربع للعثور على أفضل الموردين والمنتجات وإتمام
              صفقاتك بكل سهولة
            </p>
          </div>

          {/* Steps */}
          <div className="relative">
            {/* Connector Line - Desktop */}
            <div className="hidden md:block absolute top-24 right-[12.5%] left-[12.5%] h-0.5 bg-gold/20" />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-6 relative">
              {buyerSteps.map((step, index) => (
                <div key={index} className="relative text-center group">
                  {/* Step Number & Icon */}
                  <div className="relative z-10 w-20 h-20 mx-auto mb-6 rounded-2xl bg-white border-2 border-gold/20 group-hover:border-gold shadow-md group-hover:shadow-lg flex items-center justify-center transition-all">
                    <step.icon className="w-8 h-8 text-navy group-hover:text-gold-dark transition-colors" />
                  </div>

                  {/* Step Number Badge */}
                  <div className="absolute top-0 end-1/2 translate-x-1/2 -translate-y-2 z-20">
                    <span className="w-7 h-7 flex items-center justify-center rounded-full gradient-gold text-white text-xs font-bold shadow-md">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                    {step.description}
                  </p>

                  {/* Arrow - Mobile */}
                  {index < buyerSteps.length - 1 && (
                    <div className="md:hidden flex justify-center mt-6">
                      <ArrowLeft className="w-5 h-5 text-gold/40" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Supplier Steps */}
      <section className="py-16 md:py-20 bg-[var(--bg-light)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-gold/15 rounded-full px-4 py-1.5 mb-4">
              <Store className="w-4 h-4 text-gold-dark" />
              <span className="text-sm font-semibold text-gold-dark">للموردين والمصانع</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              خطوات البيع والتوصيل
            </h2>
            <p className="text-muted-foreground text-base max-w-2xl mx-auto">
              ابدأ في عرض منتجاتك أمام آلاف المشترين وتلقَّ الطلبات من مختلف أنحاء
              الجزائر بهذه الخطوات البسيطة
            </p>
          </div>

          {/* Steps */}
          <div className="relative">
            {/* Connector Line - Desktop */}
            <div className="hidden md:block absolute top-24 right-[12.5%] left-[12.5%] h-0.5 bg-navy/15" />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-6 relative">
              {supplierSteps.map((step, index) => (
                <div key={index} className="relative text-center group">
                  {/* Step Number & Icon */}
                  <div className="relative z-10 w-20 h-20 mx-auto mb-6 rounded-2xl bg-white border-2 border-navy/15 group-hover:border-navy shadow-md group-hover:shadow-lg flex items-center justify-center transition-all">
                    <step.icon className="w-8 h-8 text-navy" />
                  </div>

                  {/* Step Number Badge */}
                  <div className="absolute top-0 end-1/2 translate-x-1/2 -translate-y-2 z-20">
                    <span className="w-7 h-7 flex items-center justify-center rounded-full gradient-navy text-white text-xs font-bold shadow-md">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                    {step.description}
                  </p>

                  {/* Arrow - Mobile */}
                  {index < supplierSteps.length - 1 && (
                    <div className="md:hidden flex justify-center mt-6">
                      <ArrowLeft className="w-5 h-5 text-navy/30" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Additional Info Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl border border-border/50 hover:border-gold/30 hover:shadow-lg transition-all text-center"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gold/10 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-gold-dark" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 gradient-navy text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">ابدأ رحلتك الآن</h2>
          <p className="text-white/70 text-base mb-8 max-w-xl mx-auto">
            سجّل حسابك الآن وانضم إلى مجتمع بزنس إنفو من الموردين والمشترين
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="bg-gold hover:bg-gold-dark text-white rounded-lg"
            >
              <Link href="/register">
                <ArrowRight className="w-4 h-4 me-2" />
                سجّل مجاناً
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white/30 text-white hover:bg-white/10 rounded-lg"
            >
              <Link href="/contact">
                تواصل مع فريقنا
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

const buyerSteps = [
  {
    number: 1,
    icon: User,
    title: 'سجّل حسابك',
    description: 'أنشئ حسابك مجاناً في دقائق معدودة. يمكنك التسجيل كمشتري أو كشركة تبحث عن موردين موثوقين.',
  },
  {
    number: 2,
    icon: Search,
    title: 'تصفّح المنتجات',
    description: 'استخدم أدوات البحث والتصفية المتقدمة للعثور على المنتجات والموردين المناسبين لاحتياجاتك.',
  },
  {
    number: 3,
    icon: MessageSquare,
    title: 'تواصل مع المورد',
    description: 'تواصل مباشرة مع الموردين عبر نظام الرسائل المدمج، واحصل على عروض أسعار مخصصة لطلباتك.',
  },
  {
    number: 4,
    icon: CheckCircle,
    title: 'أتمم صفقتك',
    description: 'قارن العروض واختر الأنسب لك، ثم أتمم صفقتك بكل ثقة مع مورد موثق ومعتمد من المنصة.',
  },
];

const supplierSteps = [
  {
    number: 1,
    icon: Building2,
    title: 'أنشئ حساب مورد',
    description: 'سجّل حسابك كمورد أو مصنع، وأكمل بيانات شركتك للاستفادة من جميع مميزات المنصة.',
  },
  {
    number: 2,
    icon: PackagePlus,
    title: 'أضف منتجاتك',
    description: 'أضف منتجاتك وخدماتك مع تفاصيل دقيقة تشمل الأسعار والحد الأدنى للطلب والصور.',
  },
  {
    number: 3,
    icon: Inbox,
    title: 'تلقَّ طلبات',
    description: 'استقبل طلبات العروض ورسائل المشترين المهتمين بمنتجاتك من مختلف أنحاء الجزائر.',
  },
  {
    number: 4,
    icon: Truck,
    title: 'أتمم التوصيل',
    description: 'تفاوض مع المشترين وأتمم صفقاتك، ثم أرسل الطلبات لعملائك عبر شبكة التوصيل.',
  },
];

const features = [
  {
    icon: CheckCircle,
    title: 'موردين معتمدون',
    description: 'جميع الموردين على المنصة خاضعون لعملية تحقق شاملة لضمان جودة الخدمات والمنتجات.',
  },
  {
    icon: MessageSquare,
    title: 'تواصل مباشر',
    description: 'تواصل مع الموردين والمشترين مباشرة عبر نظام الرسائل الداخلي بدون وسطاء.',
  },
  {
    icon: Search,
    title: 'بحث ذكي',
    description: 'أدوات بحث وتصفية متقدمة تساعدك على العثور على ما تحتاجه بسرعة ودقة.',
  },
];
