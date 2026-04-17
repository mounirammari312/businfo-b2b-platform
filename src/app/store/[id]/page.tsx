'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useLocaleStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { cn, formatNumber, formatDate } from '@/lib/utils';
import {
  BreadcrumbNav,
  RatingStars,
  BadgeIcon,
  ProductCard,
  ProductSkeletonCard,
  SupplierDetailSkeleton,
  EmptyState,
  Pagination,
} from '@/components/shared';
import type { ProductCardData } from '@/components/shared';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Star,
  Package,
  Eye,
  CheckCircle2,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  TrendingUp,
  Send,
  Heart,
  ArrowLeft,
  ArrowRight,
  Building2,
  Loader2,
  Globe,
} from 'lucide-react';
import { toast } from 'sonner';

interface SupplierDetail {
  id: string;
  user_id: string;
  name: string;
  name_en: string;
  description: string;
  description_en: string;
  logo_url: string;
  cover_url: string;
  category: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  address_en: string;
  city: string;
  country: string;
  rating: number;
  review_count: number;
  product_count: number;
  total_sales: number;
  views: number;
  is_verified: boolean;
  status: string;
  created_at: string;
}

const PRODUCTS_PER_PAGE = 12;

export default function SupplierDetailPage() {
  const params = useParams();
  const supplierId = params.id as string;
  const { locale } = useLocaleStore();
  const t = getTranslation(locale);
  const isRtl = locale === 'ar';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const [supplier, setSupplier] = useState<SupplierDetail | null>(null);
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products');
  const [currentPage, setCurrentPage] = useState(1);
  const [badges, setBadges] = useState<string[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: supplierData, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', supplierId)
        .eq('status', 'active')
        .single();

      if (supplierData && !error) {
        setSupplier(supplierData);

        // Increment views
        await supabase
          .from('suppliers')
          .update({ views: (supplierData.views || 0) + 1 })
          .eq('id', supplierId);

        // Fetch badges
        const { data: supplierBadges } = await supabase
          .from('supplier_badges')
          .select('badge_type_id, is_active')
          .eq('supplier_id', supplierId)
          .eq('is_active', true);

        if (supplierBadges && supplierBadges.length > 0) {
          const badgeTypeIds = supplierBadges.map((b) => b.badge_type_id);
          const { data: badgeTypes } = await supabase
            .from('badge_types')
            .select('id, slug')
            .in('id', badgeTypeIds);

          if (badgeTypes) {
            setBadges(badgeTypes.map((bt) => bt.slug));
          }
        }
      }
      setLoading(false);
    }
    fetchData();
  }, [supplierId]);

  // Fetch products
  useEffect(() => {
    if (!supplier) return;
    async function fetchProducts() {
      const { data, count } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('supplier_id', supplierId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range(
          (currentPage - 1) * PRODUCTS_PER_PAGE,
          currentPage * PRODUCTS_PER_PAGE - 1
        );

      if (data) {
        // Get primary images
        const productIds = data.map((p) => p.id);
        const { data: images } = await supabase
          .from('product_images')
          .select('product_id, url, is_primary')
          .eq('is_primary', true)
          .in('product_id', productIds);

        const imgMap = new Map<string, string>();
        if (images) {
          images.forEach((img) => {
            if (!imgMap.has(img.product_id)) imgMap.set(img.product_id, img.url);
          });
        }

        const mapped: ProductCardData[] = data.map((p) => ({
          id: p.id,
          supplierId: p.supplier_id,
          supplierName: supplier.name,
          name: p.name,
          nameEn: p.name_en || undefined,
          price: p.price,
          currency: p.currency,
          imageUrl: imgMap.get(p.id) || undefined,
          description: p.description || undefined,
          inStock: p.in_stock,
          minOrder: p.min_order,
          unit: p.unit,
          isFeatured: p.is_featured,
          totalSales: p.total_sales,
        }));

        setProducts(mapped);
        setTotalProducts(count || 0);
      }
    }
    fetchProducts();
  }, [supplier, supplierId, currentPage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-light)]">
        <SupplierDetailSkeleton />
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">
            {locale === 'ar' ? 'المورد غير موجود' : 'Fournisseur introuvable'}
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            {locale === 'ar'
              ? 'لم نتمكن من العثور على هذا المورد'
              : 'Ce fournisseur est introuvable'}
          </p>
          <Button asChild className="bg-navy hover:bg-navy-light text-white rounded-xl">
            <Link href="/suppliers">
              {locale === 'ar' ? 'العودة للقائمة' : 'Retour'}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const displayName =
    locale === 'fr' && supplier.name_en ? supplier.name_en : supplier.name;
  const displayDesc =
    locale === 'fr' && supplier.description_en
      ? supplier.description_en
      : supplier.description || '';
  const displayAddress =
    locale === 'fr' && supplier.address_en
      ? supplier.address_en
      : supplier.address || '';

  const handleSend = () => {
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast.error(locale === 'ar' ? 'يرجى ملء جميع الحقول' : 'Remplissez tous les champs');
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setContactForm({ name: '', email: '', message: '' });
      toast.success(t.success.messageSent);
    }, 1000);
  };

  const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);

  return (
    <div className="min-h-screen bg-[var(--bg-light)]">
      {/* Cover Banner */}
      <div className="relative h-48 sm:h-64 bg-gradient-to-s from-navy/10 to-navy/5 overflow-hidden">
        {supplier.cover_url ? (
          <img
            src={supplier.cover_url}
            alt={displayName}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        {/* Breadcrumb */}
        <BreadcrumbNav
          items={[
            { label: t.suppliers.title, href: '/suppliers' },
            { label: displayName },
          ]}
          className="mb-4"
        />

        {/* Supplier Info Card */}
        <Card className="border-0 shadow-[var(--shadow-lg)] mb-8 overflow-hidden">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-5">
              {/* Logo */}
              <div className="shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-white bg-white shadow-[var(--shadow-md)] overflow-hidden flex items-center justify-center">
                  {supplier.logo_url ? (
                    <img
                      src={supplier.logo_url}
                      alt={displayName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-navy font-bold text-2xl">
                      {displayName.charAt(0)}
                    </span>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                    {displayName}
                  </h1>
                  {supplier.is_verified && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                  {badges.map((badge, i) => (
                    <BadgeIcon key={i} slug={badge} size="sm" />
                  ))}
                </div>

                {supplier.category && (
                  <Badge variant="secondary" className="mb-3 text-xs">
                    {supplier.category}
                  </Badge>
                )}

                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4 line-clamp-2">
                  {displayDesc}
                </p>

                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[var(--text-secondary)]">
                  <span className="flex items-center gap-1 text-gold-dark">
                    <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                    <span className="font-semibold text-sm text-foreground">
                      {supplier.rating || 0}
                    </span>
                    <span>({supplier.review_count || 0})</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    {formatNumber(supplier.views, locale)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Package className="w-3.5 h-3.5" />
                    {formatNumber(supplier.product_count, locale)}
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {formatNumber(supplier.total_sales, locale)}
                  </span>
                  {supplier.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {supplier.city}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {locale === 'ar' ? 'منذ' : 'Depuis'}{' '}
                    {formatDate(supplier.created_at, locale)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex sm:flex-col gap-2 shrink-0">
                <Button
                  className="bg-navy hover:bg-navy-light text-white rounded-xl"
                  asChild
                >
                  <Link href={`/products?supplier=${supplier.id}`}>
                    {locale === 'ar' ? 'زيارة المتجر' : 'Visiter'}
                    <ArrowIcon className="w-4 h-4 ms-1.5" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => {
                    setIsFollowing(!isFollowing);
                    toast.success(
                      isFollowing
                        ? locale === 'ar'
                          ? 'تم إلغاء المتابعة'
                          : 'Ne plus suivre'
                        : locale === 'ar'
                          ? 'تمت المتابعة'
                          : 'Suivi'
                    );
                  }}
                >
                  <Heart
                    className={cn(
                      'w-4 h-4 me-1.5',
                      isFollowing && 'fill-red-500 text-red-500'
                    )}
                  />
                  {isFollowing ? t.suppliers.following : t.suppliers.follow}
                </Button>
                {supplier.whatsapp && (
                  <a
                    href={`https://wa.me/${supplier.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      variant="outline"
                      className="rounded-xl gap-1.5 text-green-600 border-green-200 hover:bg-green-50"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </Button>
                  </a>
                )}
                {supplier.phone && (
                  <a href={`tel:${supplier.phone}`}>
                    <Button variant="outline" className="rounded-xl gap-1.5">
                      <Phone className="w-4 h-4" />
                    </Button>
                  </a>
                )}
                {supplier.email && (
                  <a href={`mailto:${supplier.email}`}>
                    <Button variant="outline" className="rounded-xl gap-1.5">
                      <Mail className="w-4 h-4" />
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
          {[
            {
              icon: Package,
              value: formatNumber(supplier.product_count, locale),
              label: locale === 'ar' ? 'منتج' : 'Produits',
              color: 'bg-navy/5 text-navy',
            },
            {
              icon: Star,
              value: supplier.rating?.toFixed(1) || '0',
              label: locale === 'ar' ? 'تقييم' : 'Note',
              color: 'bg-amber-50 text-amber-600',
            },
            {
              icon: TrendingUp,
              value: formatNumber(supplier.total_sales, locale),
              label: locale === 'ar' ? 'مبيعات' : 'Ventes',
              color: 'bg-green-50 text-green-600',
            },
          ].map((stat, i) => (
            <Card key={i} className="border border-border">
              <CardContent className="flex items-center gap-3 p-4">
                <div
                  className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center shrink-0`}
                >
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-lg sm:text-xl font-bold text-foreground leading-tight">
                    {stat.value}
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    {stat.label}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none p-0 h-auto gap-0">
            <TabsTrigger
              value="products"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-navy data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 pt-1 text-sm font-medium"
            >
              {locale === 'ar' ? 'المنتجات' : 'Produits'} ({totalProducts})
            </TabsTrigger>
            <TabsTrigger
              value="about"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-navy data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 pt-1 ms-6 text-sm font-medium"
            >
              {locale === 'ar' ? 'عن الشركة' : 'A propos'}
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-navy data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 pt-1 ms-6 text-sm font-medium"
            >
              {locale === 'ar' ? 'التقييمات' : 'Avis'}
            </TabsTrigger>
            <TabsTrigger
              value="contact"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-navy data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 pt-1 ms-6 text-sm font-medium"
            >
              {locale === 'ar' ? 'تواصل' : 'Contact'}
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="pt-6">
            {products.length === 0 ? (
              <EmptyState
                icon={Package}
                title={t.empty.noProducts}
                description={t.empty.noProductsDesc}
              />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    className="mt-8"
                  />
                )}
              </>
            )}
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="pt-6">
            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    {t.suppliers.aboutCompany}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                    {displayDesc || (
                      <span className="text-muted-foreground">
                        {locale === 'ar'
                          ? 'لا توجد معلومات متاحة'
                          : 'Aucune information disponible'}
                      </span>
                    )}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {displayAddress && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-navy mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-[var(--text-secondary)] mb-0.5">
                          {t.suppliers.companyAddress}
                        </p>
                        <p className="text-sm text-foreground">{displayAddress}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-navy mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-[var(--text-secondary)] mb-0.5">
                        {t.suppliers.memberSince}
                      </p>
                      <p className="text-sm text-foreground">
                        {formatDate(supplier.created_at, locale)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Badges */}
                {badges.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">
                      {locale === 'ar' ? 'الشارات' : 'Badges'}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {badges.map((badge, i) => (
                        <BadgeIcon key={i} slug={badge} size="md" />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="pt-6">
            <Card>
              <CardContent className="p-6">
                <EmptyState
                  icon={Star}
                  title={t.empty.noReviews}
                  description={t.empty.noReviewsDesc}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Contact Info */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold text-foreground mb-4">
                    {t.suppliers.contactInfo}
                  </h3>
                  {supplier.phone && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-navy/5 flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4 text-navy" />
                      </div>
                      <div>
                        <p className="text-xs text-[var(--text-secondary)]">Phone</p>
                        <p className="text-sm font-medium text-foreground" dir="ltr">
                          {supplier.phone}
                        </p>
                      </div>
                    </div>
                  )}
                  {supplier.whatsapp && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                        <MessageCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-[var(--text-secondary)]">WhatsApp</p>
                        <p className="text-sm font-medium text-foreground" dir="ltr">
                          {supplier.whatsapp}
                        </p>
                      </div>
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-navy/5 flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4 text-navy" />
                      </div>
                      <div>
                        <p className="text-xs text-[var(--text-secondary)]">Email</p>
                        <p className="text-sm font-medium text-foreground" dir="ltr">
                          {supplier.email}
                        </p>
                      </div>
                    </div>
                  )}
                  {supplier.city && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-navy/5 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4 text-navy" />
                      </div>
                      <div>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {locale === 'ar' ? 'المدينة' : 'Ville'}
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {supplier.city}, {supplier.country}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contact Form */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Send className="w-4 h-4 text-navy" />
                    {t.suppliers.sendMessage}
                  </h3>
                  <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">{locale === 'ar' ? 'الاسم' : 'Nom'}</Label>
                        <Input
                          value={contactForm.name}
                          onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder={locale === 'ar' ? 'اسمك الكامل' : 'Votre nom'}
                          className="h-10 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Email</Label>
                        <Input
                          type="email"
                          value={contactForm.email}
                          onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="email@example.com"
                          className="h-10 text-sm"
                          dir="ltr"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">
                        {locale === 'ar' ? 'الرسالة' : 'Message'}
                      </Label>
                      <Textarea
                        value={contactForm.message}
                        onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                        placeholder={
                          locale === 'ar'
                            ? 'اكتب رسالتك هنا...'
                            : 'Ecrivez votre message...'
                        }
                        rows={5}
                        className="text-sm resize-none"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-navy hover:bg-navy-light text-white rounded-xl h-11"
                      disabled={sending}
                    >
                      {sending ? (
                        <Loader2 className="w-4 h-4 animate-spin me-2" />
                      ) : (
                        <Send className="w-4 h-4 me-2" />
                      )}
                      {t.common.submit}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
