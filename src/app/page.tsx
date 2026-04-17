'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getApprovedSuppliers, getAllProducts, getActiveAds } from '@/lib/db';
import { useLocaleStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { cn, formatNumber, truncateText } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Search,
  ArrowLeft,
  ArrowRight,
  Star,
  Eye,
  CheckCircle2,
  TrendingUp,
  Users,
  Building2,
  Package,
  Award,
  Loader2,
  HardHat,
  Zap,
  UtensilsCrossed,
  Shirt,
  FlaskConical,
  Laptop,
  Stethoscope,
  Car,
  Sofa,
  Wheat,
  Box,
  Sparkles,
  Globe,
  ArrowRightLeft,
  Megaphone,
  FileText,
} from 'lucide-react';
import type { Supplier, Product, SupplierAd } from '@/lib/types';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  construction: HardHat,
  electronics: Zap,
  food: UtensilsCrossed,
  textiles: Shirt,
  chemicals: FlaskConical,
  technology: Laptop,
  healthcare: Stethoscope,
  automotive: Car,
  furniture: Sofa,
  agriculture: Wheat,
  packaging: Box,
  cleaning: Sparkles,
};

export default function HomePage() {
  const { locale } = useLocaleStore();
  const t = getTranslation(locale);
  const isRtl = locale === 'ar';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ads, setAds] = useState<SupplierAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [suppliersData, productsData, adsData] = await Promise.all([
        getApprovedSuppliers(),
        getAllProducts(),
        getActiveAds(),
      ]);
      setSuppliers(suppliersData);
      setProducts(productsData);
      setAds(adsData);
      setLoading(false);
    }
    fetchData();
  }, []);

  const featuredSuppliers = suppliers
    .filter((s) => s.badge !== 'none')
    .sort((a, b) => (b.badge === 'gold' ? 1 : 0) - (a.badge === 'gold' ? 1 : 0));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/suppliers?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const categoryList = [
    { key: 'construction', label: t.categories.construction },
    { key: 'electronics', label: t.categories.electronics },
    { key: 'food', label: t.categories.food },
    { key: 'textiles', label: t.categories.textiles },
    { key: 'chemicals', label: t.categories.chemicals },
    { key: 'technology', label: t.categories.technology },
    { key: 'healthcare', label: t.categories.healthcare },
    { key: 'automotive', label: t.categories.automotive },
    { key: 'furniture', label: t.categories.furniture },
    { key: 'agriculture', label: t.categories.agriculture },
  ];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-navy" />
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="relative gradient-navy-soft text-white overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]">
          <div className="absolute top-10 start-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 end-10 w-96 h-96 bg-gold rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="bg-white/10 text-gold border-white/20 mb-6 px-4 py-1.5 text-sm font-medium">
              {locale === 'ar'
                ? 'المنصة الأولى لربط الموردين والشركات في الجزائر'
                : 'La première plateforme de connexion fournisseurs-entreprises en Algérie'}
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight mb-6">
              {locale === 'ar' ? (
                <>
                  ابحث عن أفضل{' '}
                  <span className="text-gold">{locale === 'ar' ? 'الموردين' : ''}</span>
                  <br />
                  والمنتجات بأسعار{' '}
                  <span className="text-gold">{locale === 'ar' ? 'مميزة' : ''}</span>
                </>
              ) : (
                <>
                  Trouvez les meilleurs{' '}
                  <span className="text-gold">fournisseurs</span>
                  <br />
                  et produits à prix{' '}
                  <span className="text-gold">compétitifs</span>
                </>
              )}
            </h1>
            <p className="text-white/70 text-lg sm:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
              {locale === 'ar'
                ? 'منصة متكاملة تربط بين الشركات الكبرى والموردين والمصانع. اكتشف آلاف المنتجات وأفضل العروض.'
                : 'Une plateforme complète qui connecte les grandes entreprises, fournisseurs et fabricants. Découvrez des milliers de produits et les meilleures offres.'}
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute end-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.nav.search}
                  className="w-full h-13 pe-12 ps-4 rounded-xl bg-white text-gray-900 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gold/50 shadow-lg"
                  dir="auto"
                />
              </div>
              <Button
                type="submit"
                className="h-13 px-8 bg-gold hover:bg-gold-dark text-white font-semibold rounded-xl shadow-lg"
              >
                {t.common.search}
              </Button>
            </form>

            {/* Quick Stats under search */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-white/50 text-sm">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                {formatNumber(suppliers.length, locale)} {t.suppliers.title}
              </span>
              <span className="flex items-center gap-1.5">
                <Package className="w-4 h-4" />
                {formatNumber(products.length, locale)} {t.products.title}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {formatNumber(1500, locale)} {locale === 'ar' ? 'مستخدم' : 'utilisateurs'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Active Ads Banner */}
      {ads.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
          <div className="bg-gradient-to-s from-gold/5 to-gold/10 border border-gold/20 rounded-2xl p-4 sm:p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
              <Megaphone className="w-4.5 h-4.5 text-gold-dark" />
              <h3 className="font-semibold text-gold-dark text-sm">
                {locale === 'ar' ? 'عروض مميزة' : 'Offres en vedette'}
              </h3>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {ads.slice(0, 3).map((ad) => (
                <div
                  key={ad.id}
                  className="min-w-[280px] bg-white rounded-xl p-4 shadow-sm border border-gold/10 flex-shrink-0"
                >
                  <p className="font-semibold text-foreground text-sm mb-1">{ad.title}</p>
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-1">
                    {ad.description}
                  </p>
                  <p className="text-[10px] text-gold-dark mt-2">
                    {locale === 'ar' ? 'من:' : 'De:'} {ad.supplierName}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Stats Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              icon: Building2,
              label: locale === 'ar' ? 'مورد نشط' : 'Fournisseurs actifs',
              value: suppliers.length,
              color: 'bg-navy/5 text-navy',
            },
            {
              icon: Package,
              label: locale === 'ar' ? 'منتج متاح' : 'Produits disponibles',
              value: products.length,
              color: 'bg-green-50 text-green-700',
            },
            {
              icon: Users,
              label: locale === 'ar' ? 'مستخدم مسجل' : 'Utilisateurs inscrits',
              value: 1500,
              color: 'bg-purple-50 text-purple-700',
            },
            {
              icon: TrendingUp,
              label: locale === 'ar' ? 'عملية تجارية' : 'Transactions',
              value: 3200,
              color: 'bg-amber-50 text-amber-700',
            },
          ].map((stat, i) => (
            <Card key={i} className="border-0 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow">
              <CardContent className="flex items-center gap-4 p-4">
                <div
                  className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center shrink-0`}
                >
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {formatNumber(stat.value, locale)}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              {locale === 'ar' ? 'كيف تعمل المنصة؟' : 'Comment fonctionne la plateforme ?'}
            </h2>
            <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
              {locale === 'ar'
                ? 'ثلاث خطوات بسيطة للعثور على ما تحتاجه'
                : 'Trois étapes simples pour trouver ce dont vous avez besoin'}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Search,
                title: locale === 'ar' ? 'ابحث عن المنتج أو المورد' : 'Recherchez un produit ou fournisseur',
                desc: locale === 'ar'
                  ? 'استخدم محرك البحث المتقدم للعثور على أفضل الموردين والمنتجات'
                  : 'Utilisez le moteur de recherche avancé pour trouver les meilleurs fournisseurs et produits',
              },
              {
                icon: FileText,
                title: locale === 'ar' ? 'اطلب عرض سعر' : 'Demandez un devis',
                desc: locale === 'ar'
                  ? 'تواصل مع الموردين مباشرة واحصل على عروض أسعار تنافسية'
                  : 'Contactez les fournisseurs directement et obtenez des devis compétitifs',
              },
              {
                icon: ArrowRightLeft,
                title: locale === 'ar' ? 'أتمم الصفقة' : 'Finalisez la transaction',
                desc: locale === 'ar'
                  ? 'قارن العروض واختر الأفضل وأتمم عملية الشراء بأمان'
                  : 'Comparez les offres, choisissez la meilleure et finalisez votre achat en toute sécurité',
              },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 rounded-2xl gradient-navy flex items-center justify-center mx-auto mb-5 shadow-[var(--shadow-md)]">
                  <step.icon className="w-7 h-7 text-white" />
                </div>
                <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gold text-white text-xs font-bold mb-3">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-foreground mb-6">{t.categories.browseByCategory}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {categoryList.map((cat) => {
            const IconComponent = CATEGORY_ICONS[cat.key] || Box;
            return (
              <Link
                key={cat.key}
                href={`/suppliers?category=${cat.key}`}
                className="flex items-center gap-3 p-4 bg-white rounded-xl border border-border hover:border-navy/20 hover:shadow-[var(--shadow-md)] transition-card group"
              >
                <div className="w-10 h-10 rounded-lg bg-navy/5 flex items-center justify-center shrink-0 group-hover:bg-navy/10 transition-colors">
                  <IconComponent className="w-5 h-5 text-navy" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-foreground text-sm group-hover:text-navy transition-colors truncate">
                    {cat.label}
                  </p>
                </div>
                <ArrowIcon className="w-4 h-4 text-gray-300 ms-auto group-hover:text-navy transition-colors shrink-0" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Suppliers */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {t.suppliers.featured}
              </h2>
              <p className="text-[var(--text-secondary)] mt-1">
                {locale === 'ar'
                  ? 'أفضل الموردين المعتمدين على المنصة'
                  : 'Les meilleurs fournisseurs certifiés de la plateforme'}
              </p>
            </div>
            <Button variant="outline" asChild className="hidden sm:flex">
              <Link href="/suppliers" className="flex items-center gap-1.5">
                {t.common.showAll}
                <ArrowIcon className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredSuppliers.slice(0, 6).map((supplier) => (
              <Link
                key={supplier.id}
                href={`/supplier/${supplier.id}`}
                className="group"
              >
                <Card className="border border-border hover:border-navy/20 hover:shadow-[var(--shadow-lg)] transition-card overflow-hidden h-full">
                  {/* Cover */}
                  <div className="h-28 bg-gradient-to-s from-navy/5 to-navy/10 relative overflow-hidden">
                    <img
                      src={supplier.coverUrl}
                      alt={supplier.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    {supplier.badge !== 'none' && (
                      <Badge
                        className={cn(
                          'absolute top-3 end-3 text-white text-xs font-medium',
                          supplier.badge === 'gold' ? 'bg-gold' : 'bg-navy'
                        )}
                      >
                        <Award className="w-3 h-3 me-1" />
                        {supplier.badge === 'gold'
                          ? locale === 'ar'
                            ? 'ذهبي'
                            : 'Or'
                          : locale === 'ar'
                            ? 'مميز'
                            : 'Premium'}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-navy/5 flex items-center justify-center border-2 border-white shadow-[var(--shadow-sm)] -mt-8 shrink-0 overflow-hidden">
                        <img
                          src={supplier.logoUrl}
                          alt={supplier.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.innerHTML =
                              '<span class="text-navy font-bold text-sm">' +
                              supplier.name.charAt(0) +
                              '</span>';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate group-hover:text-navy transition-colors">
                          {locale === 'ar' ? supplier.name : supplier.nameEn || supplier.name}
                        </h3>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {supplier.category}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-4 leading-relaxed">
                      {locale === 'ar' ? supplier.description : supplier.descriptionEn || supplier.description}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-gold-dark">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="font-medium">{supplier.rating}</span>
                        <span className="text-[var(--text-secondary)] text-xs">
                          ({supplier.reviewCount})
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[var(--text-secondary)]">
                        <span className="flex items-center gap-1 text-xs">
                          <Eye className="w-3.5 h-3.5" />
                          {formatNumber(supplier.views, locale)}
                        </span>
                        <span className="flex items-center gap-1 text-xs">
                          <Package className="w-3.5 h-3.5" />
                          {formatNumber(supplier.productCount, locale)}
                        </span>
                      </div>
                    </div>
                    {supplier.isVerified && (
                      <div className="flex items-center gap-1 mt-3 text-green-600 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t.suppliers.verifiedSupplier}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Mobile show all */}
          <div className="mt-6 text-center sm:hidden">
            <Button variant="outline" asChild>
              <Link href="/suppliers" className="flex items-center gap-1.5 mx-auto">
                {t.common.showAll}
                <ArrowIcon className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="gradient-navy rounded-3xl p-8 sm:p-12 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.07]">
            <div className="absolute top-0 start-1/4 w-64 h-64 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 end-1/4 w-80 h-80 bg-gold rounded-full blur-3xl" />
          </div>
          <div className="relative">
            <Globe className="w-12 h-12 text-gold mx-auto mb-5" />
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              {locale === 'ar'
                ? 'هل أنت مورد أو مصنع؟'
                : 'Vous êtes fournisseur ou fabricant ?'}
            </h2>
            <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
              {locale === 'ar'
                ? 'انضم إلى آلاف الموردين على منصة بزنس إنفو ووصل بشركات كبرى في جميع أنحاء المنطقة. سجّل الآن مجانا!'
                : 'Rejoignez des milliers de fournisseurs sur Businfo et connectez-vous avec de grandes entreprises à travers la région. Inscrivez-vous gratuitement !'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-gold hover:bg-gold-dark text-white font-semibold rounded-xl px-8 h-12 shadow-lg"
              >
                <Link href="/register">
                  {locale === 'ar' ? 'سجّل كمورد مجانا' : "S'inscrire gratuitement"}
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 rounded-xl px-8 h-12"
              >
                <Link href="/suppliers">
                  {locale === 'ar' ? 'تصفح الموردين' : 'Parcourir les fournisseurs'}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
