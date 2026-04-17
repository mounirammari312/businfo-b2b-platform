'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useLocaleStore } from '@/lib/store';
import { useCurrencyStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { cn, formatNumber, truncateText } from '@/lib/utils';
import {
  BreadcrumbNav,
  RatingStars,
  BadgeIcon,
  ProductCard,
  ProductDetailSkeleton,
  EmptyState,
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
  Heart,
  Share2,
  ShoppingCart,
  MessageCircle,
  Phone,
  Mail,
  Package,
  MapPin,
  Minus,
  Plus,
  Send,
  CheckCircle2,
  Truck,
  ShieldCheck,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface ProductDetail {
  id: string;
  supplier_id: string;
  name: string;
  name_en: string;
  slug: string;
  description: string;
  description_en: string;
  price: number;
  currency: string;
  category_id: string | null;
  subcategory_id: string | null;
  min_order: number;
  unit: string;
  in_stock: boolean;
  stock_quantity: number | null;
  is_featured: boolean;
  views: number;
  total_sales: number;
  status: string;
  created_at: string;
  category?: { name: string; name_en: string; slug: string } | null;
  subcategory?: { name: string; name_en: string; slug: string } | null;
  supplier?: {
    id: string;
    name: string;
    name_en: string;
    logo_url: string;
    rating: number;
    review_count: number;
    product_count: number;
    is_verified: boolean;
    city: string;
    phone: string;
    whatsapp: string;
    email: string;
  } | null;
  images?: { id: string; url: string; alt_text: string; sort_order: number; is_primary: boolean }[];
  variations?: { id: string; variation_type: string; variation_value: string; sku: string; price_override: number | null; stock_quantity: number | null }[];
}

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  const { locale } = useLocaleStore();
  const t = getTranslation(locale);
  const isRtl = locale === 'ar';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
  const { formatPrice: storeFormatPrice } = useCurrencyStore();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [quoteMessage, setQuoteMessage] = useState('');
  const [sendingQuote, setSendingQuote] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<ProductCardData[]>(
    []
  );
  const [imageZoom, setImageZoom] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(
          `*,
          categories(id, name, name_en, slug),
          subcategories(id, name, name_en, slug),
          suppliers!inner(id, name, name_en, logo_url, rating, review_count, product_count, is_verified, city, phone, whatsapp, email)`
        )
        .eq('id', productId)
        .eq('status', 'active')
        .single();

      if (data && !error) {
        // Fetch images
        const { data: images } = await supabase
          .from('product_images')
          .select('*')
          .eq('product_id', productId)
          .order('sort_order', { ascending: true });

        // Fetch variations
        const { data: variations } = await supabase
          .from('product_variations')
          .select('*')
          .eq('product_id', productId);

        // Increment views
        await supabase
          .from('products')
          .update({ views: (data.views || 0) + 1 })
          .eq('id', productId);

        setProduct({
          ...data,
          category: data.categories as unknown as ProductDetail['category'],
          subcategory: data.subcategories as unknown as ProductDetail['subcategory'],
          supplier: data.suppliers as unknown as ProductDetail['supplier'],
          images: (images || []).sort(
            (a, b) => (a.is_primary ? -1 : 1) - (b.is_primary ? -1 : 1)
          ),
          variations: variations || [],
        });

        // Fetch related products (same category)
        if (data.category_id) {
          const { data: related } = await supabase
            .from('products')
            .select('*, suppliers!inner(name, name_en, id)')
            .eq('category_id', data.category_id)
            .eq('status', 'active')
            .neq('id', productId)
            .limit(4);

          if (related) {
            // Get images for related products
            const relatedIds = related.map((p) => p.id);
            const { data: relatedImages } = await supabase
              .from('product_images')
              .select('product_id, url, is_primary')
              .eq('is_primary', true)
              .in('product_id', relatedIds);

            const imgMap = new Map<string, string>();
            if (relatedImages) {
              relatedImages.forEach((img) => {
                if (!imgMap.has(img.product_id)) imgMap.set(img.product_id, img.url);
              });
            }

            setRelatedProducts(
              related.map((p) => {
                const supplier = p.suppliers as unknown as { name: string; name_en: string; id: string };
                return {
                  id: p.id,
                  supplierId: p.supplier_id,
                  supplierName: supplier?.name || '',
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
                };
              })
            );
          }
        }
      }
      setLoading(false);
    }
    fetchProduct();
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-light)]">
        <ProductDetailSkeleton />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">
            {locale === 'ar' ? 'المنتج غير موجود' : 'Produit introuvable'}
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            {locale === 'ar'
              ? 'لم نتمكن من العثور على هذا المنتج'
              : 'Ce produit est introuvable'}
          </p>
          <Button asChild className="bg-navy hover:bg-navy-light text-white rounded-xl">
            <Link href="/products">
              {locale === 'ar' ? 'العودة للمنتجات' : 'Retour aux produits'}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const displayName =
    locale === 'fr' && product.name_en ? product.name_en : product.name;
  const displayDesc =
    locale === 'fr' && product.description_en
      ? product.description_en
      : product.description || '';
  const supplierName = product.supplier
    ? locale === 'fr' && product.supplier.name_en
      ? product.supplier.name_en
      : product.supplier.name
    : '';
  const images = product.images || [];
  const primaryImage = images[0]?.url;

  const handleRequestQuote = () => {
    if (!quoteMessage.trim()) {
      toast.error(
        locale === 'ar'
          ? 'يرجى كتابة رسالتك'
          : 'Veuillez ecrire votre message'
      );
      return;
    }
    setSendingQuote(true);
    setTimeout(() => {
      setSendingQuote(false);
      setQuoteMessage('');
      toast.success(
        locale === 'ar'
          ? 'تم إرسال طلب عرض السعر بنجاح'
          : 'Demande de devis envoyee avec succes'
      );
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-light)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <BreadcrumbNav
          items={[
            { label: t.products.title, href: '/products' },
            ...(product.category
              ? [
                  {
                    label:
                      locale === 'fr'
                        ? product.category.name_en
                        : product.category.name,
                    href: `/products?category=${product.category.slug}`,
                  },
                ]
              : []),
            { label: truncateText(displayName, 30) },
          ]}
          className="mb-6"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Main Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-12">
          {/* Images - 60% */}
          <div className="lg:col-span-3 space-y-3">
            {/* Main Image */}
            <div
              className="relative aspect-[4/3] rounded-2xl bg-white border border-border overflow-hidden cursor-pointer group"
              onClick={() => setImageZoom(true)}
            >
              {images.length > 0 && images[selectedImage] ? (
                <img
                  src={images[selectedImage].url}
                  alt={images[selectedImage].alt_text || displayName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-16 h-16 text-muted-foreground/20" />
                </div>
              )}
              {product.is_featured && (
                <Badge className="absolute top-4 start-4 bg-gold text-white border-0 px-3 py-1 font-medium">
                  {locale === 'ar' ? 'مميز' : 'En vedette'}
                </Badge>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(idx)}
                    className={cn(
                      'w-20 h-20 rounded-lg overflow-hidden border-2 shrink-0 transition-all',
                      selectedImage === idx
                        ? 'border-navy shadow-[var(--shadow-md)]'
                        : 'border-transparent hover:border-border'
                    )}
                  >
                    <img
                      src={img.url}
                      alt={img.alt_text || ''}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info - 40% */}
          <div className="lg:col-span-2 space-y-5">
            {/* Name */}
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-snug mb-2">
                {displayName}
              </h1>
              {product.supplier && (
                <Link
                  href={`/supplier/${product.supplier.id}`}
                  className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-navy transition-colors"
                >
                  <div className="w-5 h-5 rounded-full bg-navy/10 flex items-center justify-center">
                    {product.supplier.logo_url ? (
                      <img
                        src={product.supplier.logo_url}
                        alt=""
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <Package className="w-3 h-3 text-navy" />
                    )}
                  </div>
                  {supplierName}
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <RatingStars
                rating={product.supplier?.rating || 0}
                reviewCount={product.supplier?.review_count}
                size="md"
              />
            </div>

            {/* Price */}
            <div className="bg-muted/50 rounded-xl p-4">
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-navy">
                  {storeFormatPrice(product.price)}
                </span>
                <span className="text-sm text-[var(--text-secondary)] mb-1">
                  / {product.unit || t.products.unitPiece}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-secondary)]">
                <span>
                  {locale === 'ar' ? 'الحد الأدنى:' : 'Min. commande:'}{' '}
                  <strong>{product.min_order}</strong>{' '}
                  {product.unit}
                </span>
                {product.stock_quantity != null && (
                  <span>
                    {locale === 'ar' ? 'المخزون:' : 'Stock:'}{' '}
                    <strong>{formatNumber(product.stock_quantity, locale)}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {product.in_stock ? (
                <Badge className="bg-green-100 text-green-700 border-0 gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {t.products.inStock}
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-700 border-0">
                  {t.products.outOfStock}
                </Badge>
              )}
              {product.total_sales > 0 && (
                <span className="text-xs text-[var(--text-secondary)]">
                  {formatNumber(product.total_sales, locale)}{' '}
                  {locale === 'ar' ? 'مبيعات' : 'ventes'}
                </span>
              )}
            </div>

            {/* Variations */}
            {product.variations && product.variations.length > 0 && (
              <div className="space-y-2">
                {Array.from(
                  new Set(product.variations.map((v) => v.variation_type))
                ).map((type) => (
                  <div key={type} className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      {type === 'size'
                        ? locale === 'ar' ? 'الحجم' : 'Taille'
                        : type === 'color'
                          ? locale === 'ar' ? 'اللون' : 'Couleur'
                          : type === 'material'
                            ? locale === 'ar' ? 'المادة' : 'Materiau'
                            : type === 'weight'
                              ? locale === 'ar' ? 'الوزن' : 'Poids'
                              : type}
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {product
                        .variations!.filter((v) => v.variation_type === type)
                        .map((v) => (
                          <Badge
                            key={v.id}
                            variant="outline"
                            className="cursor-pointer hover:border-navy text-xs"
                          >
                            {v.variation_value}
                          </Badge>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-3">
              <Label className="text-sm font-medium shrink-0">
                {locale === 'ar' ? 'الكمية' : 'Quantite'}:
              </Label>
              <div className="flex items-center border border-border rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="h-9 w-16 text-center border-0 focus-visible:ring-0 text-sm"
                  min={1}
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="text-xs text-[var(--text-secondary)]">
                {product.unit}
              </span>
            </div>

            {/* Actions */}
            <div className="space-y-2.5">
              <Button className="w-full h-12 bg-navy hover:bg-navy-light text-white rounded-xl font-semibold text-sm">
                <Send className="w-4 h-4 me-2" />
                {t.products.requestQuote}
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 h-11 rounded-xl"
                  onClick={() => toast.success(locale === 'ar' ? 'تمت الإضافة للمفضلة' : 'Ajoute aux favoris')}
                >
                  <Heart className="w-4 h-4 me-1.5" />
                  {locale === 'ar' ? 'المفضلة' : 'Favoris'}
                </Button>
                <Button variant="outline" className="h-11 w-11 rounded-xl p-0">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Supplier Card */}
            {product.supplier && (
              <Card className="border border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Link href={`/supplier/${product.supplier.id}`}>
                      <div className="w-11 h-11 rounded-xl bg-navy/5 border border-border overflow-hidden flex items-center justify-center">
                        {product.supplier.logo_url ? (
                          <img
                            src={product.supplier.logo_url}
                            alt={supplierName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-navy font-bold text-sm">
                            {supplierName.charAt(0)}
                          </span>
                        )}
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/supplier/${product.supplier.id}`}
                        className="text-sm font-semibold text-foreground hover:text-navy transition-colors line-clamp-1"
                      >
                        {supplierName}
                      </Link>
                      <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                        {product.supplier.is_verified && (
                          <BadgeIcon slug="verified" size="sm" />
                        )}
                        {product.supplier.city && (
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" />
                            {product.supplier.city}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="flex-1 rounded-lg text-xs"
                    >
                      <Link href={`/supplier/${product.supplier.id}`}>
                        {locale === 'ar' ? 'زيارة المتجر' : 'Visiter'}
                        <ArrowIcon className="w-3.5 h-3.5 ms-1" />
                      </Link>
                    </Button>
                    <a
                      href={`https://wa.me/${(product.supplier.whatsapp || '').replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs h-9"
                      >
                        <MessageCircle className="w-3.5 h-3.5 me-1" />
                        WhatsApp
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  icon: ShieldCheck,
                  label:
                    locale === 'ar' ? 'مورد معتمد' : 'Fournisseur certifie',
                },
                {
                  icon: Truck,
                  label:
                    locale === 'ar' ? 'شحن متاح' : 'Livraison disponible',
                },
                {
                  icon: RotateCcw,
                  label:
                    locale === 'ar' ? 'سياسة إرجاع' : 'Politique de retour',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-muted/50 text-center"
                >
                  <item.icon className="w-4 h-4 text-navy" />
                  <span className="text-[10px] text-[var(--text-secondary)] leading-tight">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="description" className="mb-12">
          <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none p-0 h-auto gap-0">
            <TabsTrigger
              value="description"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-navy data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 pt-1 text-sm font-medium"
            >
              {locale === 'ar' ? 'الوصف' : 'Description'}
            </TabsTrigger>
            <TabsTrigger
              value="specs"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-navy data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 pt-1 ms-6 text-sm font-medium"
            >
              {locale === 'ar' ? 'المواصفات' : 'Specifications'}
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-navy data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 pt-1 ms-6 text-sm font-medium"
            >
              {locale === 'ar' ? 'التقييمات' : 'Avis'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="pt-6">
            <Card>
              <CardContent className="p-6">
                <div
                  className="prose prose-sm max-w-none text-foreground/80 leading-relaxed whitespace-pre-wrap"
                >
                  {displayDesc || (
                    <span className="text-[var(--text-secondary)]">
                      {locale === 'ar'
                        ? 'لا يوجد وف متاح'
                        : 'Aucune description disponible'}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="specs" className="pt-6">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {[
                    {
                      label: locale === 'ar' ? 'السعر' : 'Prix',
                      value: `${storeFormatPrice(product.price)} / ${product.unit}`,
                    },
                    {
                      label: locale === 'ar' ? 'العملة' : 'Devise',
                      value: product.currency,
                    },
                    {
                      label: t.products.minOrder,
                      value: `${product.min_order} ${product.unit}`,
                    },
                    {
                      label: locale === 'ar' ? 'المخزون' : 'Stock',
                      value: product.in_stock
                        ? product.stock_quantity != null
                          ? `${formatNumber(product.stock_quantity, locale)} ${product.unit}`
                          : locale === 'ar'
                            ? 'متوفر'
                            : 'En stock'
                        : locale === 'ar'
                          ? 'غير متوفر'
                          : 'Rupture',
                    },
                    ...(product.category
                      ? [
                          {
                            label:
                              locale === 'ar' ? 'التصنيف' : 'Categorie',
                            value:
                              locale === 'fr'
                                ? product.category.name_en
                                : product.category.name,
                          },
                        ]
                      : []),
                    ...(product.subcategory
                      ? [
                          {
                            label:
                              locale === 'ar'
                                ? 'القسم الفرعي'
                                : 'Sous-categorie',
                            value:
                              locale === 'fr'
                                ? product.subcategory.name_en
                                : product.subcategory.name,
                          },
                        ]
                      : []),
                    ...(product.variations || [])
                      .filter((v) => v.variation_type)
                      .map((v) => ({
                        label:
                          v.variation_type === 'size'
                            ? locale === 'ar' ? 'الحجم' : 'Taille'
                            : v.variation_type === 'color'
                              ? locale === 'ar' ? 'اللون' : 'Couleur'
                              : v.variation_type,
                        value: v.variation_value + (v.sku ? ` (${v.sku})` : ''),
                      })),
                  ].map((spec, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex items-center justify-between py-2.5',
                        i > 0 && 'border-t border-border'
                      )}
                    >
                      <span className="text-sm text-[var(--text-secondary)]">
                        {spec.label}
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {spec.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

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
        </Tabs>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">
                {locale === 'ar' ? 'منتجات مشابهة' : 'Produits similaires'}
              </h2>
              <Button variant="outline" size="sm" asChild className="rounded-lg text-xs">
                <Link href="/products">
                  {t.common.showAll}
                  <ArrowIcon className="w-3.5 h-3.5 ms-1" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Image Zoom Modal */}
      {imageZoom && images.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setImageZoom(false)}
        >
          <button
            onClick={() => setImageZoom(false)}
            className="absolute top-4 end-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={images[selectedImage]?.url}
            alt=""
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          {images.length > 1 && (
            <div className="absolute bottom-4 start-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage(idx);
                  }}
                  className={cn(
                    'w-3 h-3 rounded-full transition-colors',
                    selectedImage === idx
                      ? 'bg-white'
                      : 'bg-white/30 hover:bg-white/50'
                  )}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
