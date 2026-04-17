'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Award,
  Eye,
  Lightbulb,
  Shield,
  Users,
  Package,
  Globe,
  Target,
  ArrowLeft,
  Building2,
  TrendingUp,
  Handshake,
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-navy text-white py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/10 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-gold" />
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">من نحن</h1>
          <p className="text-lg md:text-xl text-white/70 max-w-3xl mx-auto leading-relaxed">
            بزنس إنفو هي المنصة الرائدة في الجزائر لربط الموردين والشركات الكبرى،
            نسعى لتسهيل التجارة بين الأعمال وتوفير بيئة موثوقة للتعاون التجاري
          </p>
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              asChild
              className="bg-gold hover:bg-gold-dark text-white rounded-lg"
            >
              <Link href="/register">
                <Building2 className="w-4 h-4 me-2" />
                انضم إلينا
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 rounded-lg"
            >
              <Link href="/contact">
                <ArrowLeft className="w-4 h-4 me-2" />
                تواصل معنا
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="w-12 h-12 rounded-xl bg-navy/10 flex items-center justify-center mb-5">
                <Target className="w-6 h-6 text-navy" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">مهمتنا</h2>
              <p className="text-muted-foreground leading-relaxed text-base mb-4">
                مهمتنا هي ربط الموردين والشركات في الجزائر والعالم، وتمكينهم من
                بناء شراكات تجارية قوية ومستدامة. نؤمن بأن التجارة الرقمية هي
                مستقبل الاقتصاد الجزائري، ونعمل على تسهيل الوصول إلى أفضل المنتجات
                والخدمات بأسعار تنافسية.
              </p>
              <p className="text-muted-foreground leading-relaxed text-base">
                من خلال منصتنا، نوفر لكل من الموردين والمشترين بيئة آمنة وشفافة
                للتعاملات التجارية، مدعومة بأدوات ذكية لتسهيل عملية البحث والتواصل
                وإتمام الصفقات.
              </p>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl gradient-navy-soft p-8 flex flex-col justify-center items-center text-center">
                <Target className="w-20 h-20 text-gold mb-4" />
                <p className="text-white/80 text-lg font-medium leading-relaxed">
                  &quot;ربط الموردين والشركات في الجزائر والعالم لتحقيق نمو تجاري مستدام&quot;
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-16 md:py-20 bg-[var(--bg-light)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 relative">
              <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 p-8 flex flex-col justify-center items-center text-center">
                <Eye className="w-20 h-20 text-gold-dark mb-4" />
                <p className="text-foreground text-lg font-medium leading-relaxed">
                  &quot;أن نصبح المنصة الأولى للأعمال في الجزائر وشمال إفريقيا&quot;
                </p>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="w-12 h-12 rounded-xl bg-gold/15 flex items-center justify-center mb-5">
                <Eye className="w-6 h-6 text-gold-dark" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">رؤيتنا</h2>
              <p className="text-muted-foreground leading-relaxed text-base mb-4">
                نطمح لأن نكون المنصة الرائدة والأكثر ثقة في مجال التجارة بين
                الأعمال (B2B) في الجزائر وشمال إفريقيا. نسعى لبناء نظام بيئي رقمي
                متكامل يخدم جميع أطراف العملية التجارية.
              </p>
              <p className="text-muted-foreground leading-relaxed text-base">
                نؤمن بأن المستقبل يكمن في التحول الرقمي للتجارة، وأن كل مورد
                جزائري يستحق فرصة الوصول إلى أسواق أوسع، وأن كل شركة تحتاج إلى
                شريك تجاري موثوق تستطيع الاعتماد عليه.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">قيمنا الأساسية</h2>
            <p className="text-muted-foreground text-base max-w-2xl mx-auto">
              نلتزم بأعلى معايير الجودة والأمان في كل ما نقوم به، ونعمل وفق قيم
              تضمن تجربة مميزة لجميع مستخدمينا
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((item, index) => (
              <Card
                key={index}
                className="border-border/50 hover:border-gold/30 hover:shadow-lg transition-all group"
              >
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-navy/5 group-hover:bg-navy/10 flex items-center justify-center transition-colors">
                    <item.icon className="w-7 h-7 text-navy" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 md:py-20 gradient-navy text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">أرقام تفتخر بها</h2>
            <p className="text-white/60 text-base">نمو مستمر في خدمة مجتمع الأعمال</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white/10 flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-gold" />
                </div>
                <p className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-sm text-white/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">فريق العمل</h2>
            <p className="text-muted-foreground text-base max-w-2xl mx-auto">
              فريق من المتخصصين يعملون بشغف لتطوير أفضل منصة للأعمال في الجزائر
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className="group text-center p-6 rounded-2xl border border-border/50 hover:border-gold/30 hover:shadow-lg transition-all"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-full gradient-navy flex items-center justify-center">
                  <Users className="w-10 h-10 text-white/70" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-1">{member.name}</h3>
                <p className="text-sm text-gold-dark font-medium mb-2">{member.role}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-[var(--bg-light)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="p-8 md:p-12 rounded-2xl bg-gradient-to-br from-navy to-navy-dark text-white">
            <Handshake className="w-12 h-12 text-gold mx-auto mb-5" />
            <h2 className="text-2xl md:text-3xl font-bold mb-3">هل أنت مستعد للبدء؟</h2>
            <p className="text-white/70 text-base mb-8 max-w-xl mx-auto">
              انضم إلى آلاف الموردين والشركات التي تستفيد من منصة بزنس إنفو يومياً
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="bg-gold hover:bg-gold-dark text-white rounded-lg"
              >
                <Link href="/register">
                  <Building2 className="w-4 h-4 me-2" />
                  سجّل مجاناً الآن
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 rounded-lg"
              >
                <Link href="/how-it-works">
                  <TrendingUp className="w-4 h-4 me-2" />
                  تعرّف على كيف يعمل
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

const values = [
  {
    icon: Award,
    title: 'الجودة',
    description: 'نلتزم بأعلى معايير الجودة في عرض المنتجات والخدمات، ونسعى دائماً لتقديم أفضل تجربة للمستخدم.',
  },
  {
    icon: Shield,
    title: 'الثقة',
    description: 'نبني علاقات تجارية مبنية على الشفافية والمصداقية، ونتحقق من هوية جميع الموردين المعلنين.',
  },
  {
    icon: Lightbulb,
    title: 'الابتكار',
    description: 'نستخدم أحدث التقنيات لتطوير أدوات ذكية تسهل عملية البحث والمقارنة والتواصل بين الأطراف.',
  },
  {
    icon: Users,
    title: 'الخدمة',
    description: 'نوفر دعماً متواصلاً لعملائنا عبر فريق متخصص يساعد على حل جميع المشكلات والاستفسارات.',
  },
];

const stats = [
  { icon: Users, value: '+2,500', label: 'مورد معتمد' },
  { icon: Package, value: '+15,000', label: 'منتج متاح' },
  { icon: Globe, value: '+48', label: 'ولاية جزائرية' },
  { icon: TrendingUp, value: '+10,000', label: 'صفقة ناجحة' },
];

const teamMembers = [
  {
    name: 'أحمد بن عمر',
    role: 'المدير التنفيذي',
    bio: 'خبرة تزيد عن 15 عاماً في قطاع التجارة الإلكترونية وإدارة الأعمال',
  },
  {
    name: 'سارة محمدي',
    role: 'مديرة التسويق',
    bio: 'متخصصة في التسويق الرقمي وبناء العلامات التجارية في الأسواق العربية',
  },
  {
    name: 'كريم بلقاسم',
    role: 'المدير التقني',
    bio: 'مهندس برمجيات بخبرة واسعة في تطوير المنصات الرقمية والأنظمة',
  },
  {
    name: 'نادية حمداني',
    role: 'مديرة الشراكات',
    bio: 'خبيرة في بناء الشراكات الاستراتيجية وتطوير الأعمال في شمال إفريقيا',
  },
];
