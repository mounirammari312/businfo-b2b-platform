'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useLocaleStore, useCurrencyStore } from '@/lib/store';
import { cn, formatPrice } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Heart, X, Package, Building2, Star, MapPin, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface FavProduct {
  id: string;
  product_id: string;
  product_name: string;
  product_name_en?: string;
  price: number;
  currency: string;
  supplier_name: string;
  image_url?: string;
  in_stock?: boolean;
  supplier_id: string;
}

interface FavSupplier {
  id: string;
  supplier_id: string;
  supplier_name: string;
  supplier_name_en?: string;
  category?: string;
  logo_url?: string;
  rating?: number;
  product_count?: number;
  city?: string;
  is_verified?: boolean;
}

export default function BuyerFavoritesPage() {
  const { user } = useAuth();
  const { locale } = useLocaleStore();
  const { formatPrice: storeFormatPrice } = useCurrencyStore();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<FavProduct[]>([]);
  const [suppliers, setSuppliers] = useState<FavSupplier[]>([]);
  const [activeTab, setActiveTab] = useState('products');

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [favProductsRes, favSuppliersRes] = await Promise.all([
        supabase
          .from('favorites')
          .select('id, product_id, created_at')
          .eq('user_id', user.id)
          .not('product_id', 'is', null),
        supabase
          .from('favorites')
          .select('id, supplier_id, created_at')
          .eq('user_id', user.id)
          .not('supplier_id', 'is', null),
      ]);

      // Load product details
      if (favProductsRes.data && favProductsRes.data.length > 0) {
        const productIds = favProductsRes.data.map((f) => f.product_id);
        const { data: productsData } = await supabase
          .from('products')
          .select('id, name, name_en, price, currency, in_stock, supplier_id, suppliers(name)')
          .in('id', productIds);

        const imageRes = await supabase
          .from('product_images')
          .select('product_id, url, is_primary')
          .in('product_id', productIds)
          .eq('is_primary', true);

        const imageMap: Record<string, string> = {};
        if (imageRes.data) {
          imageRes.data.forEach((img) => {
            imageMap[img.product_id] = img.url;
          });
        }

        setProducts(
          (productsData || []).map((p) => ({
            id: favProductsRes.data.find((f) => f.product_id === p.id)?.id || '',
            product_id: p.id,
            product_name: p.name,
            product_name_en: p.name_en || undefined,
            price: p.price,
            currency: p.currency,
            supplier_name: (p.suppliers as unknown as { name: string })?.name || '',
            image_url: imageMap[p.id] || undefined,
            in_stock: p.in_stock,
            supplier_id: p.supplier_id,
          }))
        );
      } else {
        setProducts([]);
      }

      // Load supplier details
      if (favSuppliersRes.data && favSuppliersRes.data.length > 0) {
        const supplierIds = favSuppliersRes.data.map((f) => f.supplier_id);
        const { data: suppliersData } = await supabase
          .from('suppliers')
          .select('id, name, name_en, category, logo_url, rating, product_count, city, is_verified')
          .in('id', supplierIds);

        setSuppliers(
          (suppliersData || []).map((s) => ({
            id: favSuppliersRes.data.find((f) => f.supplier_id === s.id)?.id || '',
            supplier_id: s.id,
            supplier_name: s.name,
            supplier_name_en: s.name_en || undefined,
            category: s.category || undefined,
            logo_url: s.logo_url || undefined,
            rating: s.rating,
            product_count: s.product_count,
            city: s.city || undefined,
            is_verified: s.is_verified,
          }))
        );
      } else {
        setSuppliers([]);
      }
    } catch (err) {
      console.error('Error loading favorites:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const removeProduct = async (favId: string) => {
    try {
      const { error } = await supabase.from('favorites').delete().eq('id', favId);
      if (error) throw error;
      setProducts((prev) => prev.filter((p) => p.id !== favId));
      toast.success(locale === 'ar' ? 'تمت الإزالة من المفضلة' : 'Retire des favoris');
    } catch {
      toast.error(locale === 'ar' ? 'حدث خطأ' : 'Erreur');
    }
  };

  const removeSupplier = async (favId: string) => {
    try {
      const { error } = await supabase.from('favorites').delete().eq('id', favId);
      if (error) throw error;
      setSuppliers((prev) => prev.filter((s) => s.id !== favId));
      toast.success(locale === 'ar' ? 'تم إلغاء المتابعة' : 'Ne plus suivre');
    } catch {
      toast.error(locale === 'ar' ? 'حدث خطأ' : 'Erreur');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">
          {locale === 'ar' ? 'المفضلة' : 'Favoris'}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {locale === 'ar'
            ? `${products.length} منتج، ${suppliers.length} مورد`
            : `${products.length} produit(s), ${suppliers.length} fournisseur(s)`}
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="products" className="text-sm">
            <Package className="w-4 h-4 me-1.5" />
            {locale === 'ar' ? 'المنتجات' : 'Produits'}
            {!loading && products.length > 0 && (
              <span className="ms-1.5 text-xs bg-navy/10 text-navy px-1.5 py-0 rounded-full">{products.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="text-sm">
            <Building2 className="w-4 h-4 me-1.5" />
            {locale === 'ar' ? 'الموردين' : 'Fournisseurs'}
            {!loading && suppliers.length > 0 && (
              <span className="ms-1.5 text-xs bg-navy/10 text-navy px-1.5 py-0 rounded-full">{suppliers.length}</span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="border-border overflow-hidden">
                  <Skeleton className="w-full h-40" />
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-5 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-5">
                <Heart className="w-10 h-10 text-muted-foreground/40" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {locale === 'ar' ? 'لا توجد منتجات مفضلة' : 'Aucun produit favori'}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {locale === 'ar'
                  ? 'أضف منتجات للمفضلة للوصول إليها بسرعة'
                  : 'Ajoutez des produits en favori pour y acceder rapidement'}
              </p>
              <Button asChild className="bg-navy hover:bg-navy-light text-white rounded-xl">
                <Link href="/products">{locale === 'ar' ? 'تصفح المنتجات' : 'Parcourir les produits'}</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <Card key={product.id} className="border-border overflow-hidden group hover:shadow-[var(--shadow-md)] transition-all">
                  <div className="relative aspect-[4/3] bg-muted">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={locale === 'fr' && product.product_name_en ? product.product_name_en : product.product_name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-10 h-10 text-muted-foreground/30" />
                      </div>
                    )}
                    <button
                      onClick={(e) => { e.preventDefault(); removeProduct(product.id); }}
                      className="absolute top-2.5 end-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-red-50 hover:text-red-500 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <CardContent className="p-4">
                    <Link href={`/products/${product.product_id}`} className="group-hover:text-navy transition-colors">
                      <p className="text-xs text-muted-foreground mb-1">{product.supplier_name}</p>
                      <h3 className="font-semibold text-sm leading-snug line-clamp-2 mb-2">
                        {locale === 'fr' && product.product_name_en ? product.product_name_en : product.product_name}
                      </h3>
                    </Link>
                    <div className="flex items-center justify-between">
                      <p className="text-base font-bold text-navy">{storeFormatPrice(product.price)}</p>
                      {!product.in_stock && (
                        <span className="text-[10px] text-red-500 font-medium">{locale === 'ar' ? 'غير متوفر' : 'Rupture'}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="border-border">
                  <Skeleton className="w-full h-28" />
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-3 -mt-8 relative z-10">
                      <Skeleton className="w-14 h-14 rounded-xl border-2 border-white" />
                      <div className="flex-1 space-y-2 pt-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : suppliers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-5">
                <Building2 className="w-10 h-10 text-muted-foreground/40" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {locale === 'ar' ? 'لا يوجد موردين مفضلين' : 'Aucun fournisseur favori'}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {locale === 'ar'
                  ? 'تابع الموردين لتلقي آخر العروض والمنتجات'
                  : 'Suivez des fournisseurs pour recevoir leurs dernieres offres'}
              </p>
              <Button asChild className="bg-navy hover:bg-navy-light text-white rounded-xl">
                <Link href="/suppliers">{locale === 'ar' ? 'تصفح الموردين' : 'Parcourir les fournisseurs'}</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {suppliers.map((supplier) => (
                <Card key={supplier.id} className="border-border overflow-hidden group hover:shadow-[var(--shadow-md)] transition-all">
                  <div className="relative h-28 bg-gradient-to-s from-navy/5 to-navy/10">
                    <button
                      onClick={() => removeSupplier(supplier.id)}
                      className="absolute top-2.5 end-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-red-50 hover:text-red-500 transition-all z-10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <CardContent className="p-4 -mt-8 relative z-10">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-14 h-14 rounded-xl border-2 border-white bg-white shadow-sm overflow-hidden shrink-0 flex items-center justify-center">
                        {supplier.logo_url ? (
                          <img
                            src={supplier.logo_url}
                            alt={supplier.supplier_name}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <span className="text-navy font-bold text-lg">{supplier.supplier_name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="min-w-0 pt-3">
                        <Link href={`/supplier/${supplier.supplier_id}`} className="group-hover:text-navy transition-colors">
                          <h3 className="font-semibold text-sm truncate">
                            {locale === 'fr' && supplier.supplier_name_en ? supplier.supplier_name_en : supplier.supplier_name}
                          </h3>
                        </Link>
                        {supplier.category && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">{supplier.category}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        {supplier.is_verified && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                        <span>{supplier.rating?.toFixed(1) || '0.0'}</span>
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          {supplier.product_count || 0}
                        </span>
                        {supplier.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {supplier.city}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
