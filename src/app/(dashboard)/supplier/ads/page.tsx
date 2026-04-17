'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLocaleStore } from '@/lib/store';
import { formatPrice, formatDate, cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Megaphone,
  Upload,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MousePointer,
  BarChart3,
  Image as ImageIcon,
  ExternalLink,
  Monitor,
  LayoutGrid,
  Zap,
  Newspaper,
  PanelRight,
} from 'lucide-react';

interface AdType {
  id: string;
  name: string;
  name_en: string;
  slug: string;
  placement_type: string;
  description: string;
  price: number;
  is_active: boolean;
}

interface AdRequest {
  id: string;
  ad_type_id: string;
  ad_type_name: string;
  ad_type_name_en: string;
  title: string;
  description: string;
  image_url: string;
  target_url: string;
  status: string;
  admin_note: string;
  start_date: string;
  end_date: string;
  impressions: number;
  clicks: number;
  created_at: string;
}

const statusConfig: Record<string, { ar: string; en: string; color: string }> = {
  pending: { ar: 'قيد الانتظار', en: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  active: { ar: 'نشط', en: 'Active', color: 'bg-green-100 text-green-800' },
  rejected: { ar: 'مرفوض', en: 'Rejected', color: 'bg-red-100 text-red-800' },
  expired: { ar: 'منتهي', en: 'Expired', color: 'bg-gray-100 text-gray-800' },
};

const placementIcons: Record<string, React.ReactNode> = {
  banner: <Monitor className="w-8 h-8" />,
  featured: <Star className="w-8 h-8" />,
  product_boost: <Zap className="w-8 h-8" />,
  category: <LayoutGrid className="w-8 h-8" />,
  sidebar: <PanelRight className="w-8 h-8" />,
};

const placementDescriptions: Record<string, { ar: string; en: string }> = {
  banner: { ar: 'إعلان رئيسي في أعلى الصفحة', en: 'Main banner at top of page' },
  featured: { ar: 'عرض في قسم المنتجات المميزة', en: 'Featured in the featured section' },
  product_boost: { ar: 'تعزيز ظهور المنتج في نتائج البحث', en: 'Boost product visibility in search' },
  category: { ar: 'إعلان في صفحة التصنيف', en: 'Ad in category page' },
  sidebar: { ar: 'إعلان جانبي في الشريط الجانبي', en: 'Sidebar ad placement' },
};

function Star({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export default function AdRequests() {
  const { locale } = useLocaleStore();
  const { supplier } = useAuth();
  const [adTypes, setAdTypes] = useState<AdType[]>([]);
  const [adRequests, setAdRequests] = useState<AdRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestDialog, setRequestDialog] = useState<AdType | null>(null);
  const [adTitle, setAdTitle] = useState('');
  const [adDescription, setAdDescription] = useState('');
  const [adImageUrl, setAdImageUrl] = useState('');
  const [adTargetUrl, setAdTargetUrl] = useState('');
  const [adStartDate, setAdStartDate] = useState('');
  const [adEndDate, setAdEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [supplier?.id]);

  const loadData = async () => {
    if (!supplier?.id) return;
    setLoading(true);
    try {
      const { data: types } = await supabase.from('ad_types').select('*').eq('is_active', true);
      setAdTypes((types || []).map(t => ({
        id: t.id, name: t.name, name_en: t.name_en, slug: t.slug,
        placement_type: t.placement_type, description: t.description || '',
        price: Number(t.price), is_active: t.is_active,
      })));

      const { data: requests } = await supabase
        .from('ad_requests')
        .select('*, ad_types(name, name_en)')
        .eq('supplier_id', supplier.id)
        .order('created_at', { ascending: false });

      setAdRequests((requests || []).map(r => ({
        id: r.id,
        ad_type_id: r.ad_type_id,
        ad_type_name: (r.ad_types as Record<string, string>)?.name || '',
        ad_type_name_en: (r.ad_types as Record<string, string>)?.name_en || '',
        title: r.title,
        description: r.description || '',
        image_url: r.image_url || '',
        target_url: r.target_url || '',
        status: r.status,
        admin_note: r.admin_note || '',
        start_date: r.start_date || '',
        end_date: r.end_date || '',
        impressions: r.impressions || 0,
        clicks: r.clicks || 0,
        created_at: r.created_at,
      })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAd = async () => {
    if (!requestDialog || !supplier?.id) return;
    if (!adTitle.trim()) {
      toast.error(locale === 'ar' ? 'عنوان الإعلان مطلوب' : 'Ad title is required');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('ad_requests').insert({
        supplier_id: supplier.id,
        ad_type_id: requestDialog.id,
        title: adTitle.trim(),
        description: adDescription.trim() || null,
        image_url: adImageUrl.trim() || null,
        target_url: adTargetUrl.trim() || null,
        start_date: adStartDate || null,
        end_date: adEndDate || null,
      });

      if (error) throw error;
      toast.success(locale === 'ar' ? 'تم إرسال طلب الإعلان' : 'Ad request submitted');
      setRequestDialog(null);
      setAdTitle('');
      setAdDescription('');
      setAdImageUrl('');
      setAdTargetUrl('');
      setAdStartDate('');
      setAdEndDate('');
      loadData();
    } catch (err) {
      toast.error(locale === 'ar' ? 'فشل إرسال الطلب' : 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const activeAds = adRequests.filter(a => a.status === 'active');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{locale === 'ar' ? 'طلب إعلان' : 'Ad Requests'}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {locale === 'ar' ? 'روّج لمنتجاتك ومتجرك عبر الإعلانات' : 'Promote your products and store with ads'}
        </p>
      </div>

      {/* Active Ads Stats */}
      {activeAds.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeAds.map(ad => (
            <Card key={ad.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-sm">{ad.title}</span>
                  <Badge className="bg-green-100 text-green-800">{statusConfig.active[locale === 'ar' ? 'ar' : 'en']}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <Eye className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                    <p className="text-lg font-bold">{ad.impressions.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{locale === 'ar' ? 'مشاهدة' : 'Impressions'}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <MousePointer className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                    <p className="text-lg font-bold">{ad.clicks.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{locale === 'ar' ? 'نقرة' : 'Clicks'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs defaultValue="available">
        <TabsList>
          <TabsTrigger value="available">{locale === 'ar' ? 'الإعلانات المتاحة' : 'Available Ads'}</TabsTrigger>
          <TabsTrigger value="history">{locale === 'ar' ? 'سجل الطلبات' : 'Request History'} ({adRequests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="available">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-56 w-full" />)}
            </div>
          ) : adTypes.length === 0 ? (
            <div className="text-center py-16 text-sm text-muted-foreground">
              {locale === 'ar' ? 'لا توجد إعلانات متاحة حالياً' : 'No ads available at this time'}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {adTypes.map(adType => (
                <Card key={adType.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-14 h-14 rounded-xl bg-navy/10 flex items-center justify-center text-navy mb-4">
                      {placementIcons[adType.placement_type] || <Megaphone className="w-8 h-8" />}
                    </div>
                    <h3 className="font-bold text-lg">{locale === 'ar' ? adType.name : adType.name_en}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {placementDescriptions[adType.placement_type]?.[locale === 'ar' ? 'ar' : 'en'] || adType.description}
                    </p>

                    {/* Placement Preview */}
                    <div className="mt-3 p-2 bg-muted/30 rounded-lg border border-dashed">
                      <div className="h-12 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                        {locale === 'ar' ? 'معاينة الموضع' : 'Placement Preview'}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <p className="text-lg font-bold text-navy">{formatPrice(adType.price)}/<span className="text-xs text-muted-foreground font-normal">{locale === 'ar' ? 'أسبوع' : 'week'}</span></p>
                      <Button onClick={() => { setRequestDialog(adType); setAdTitle(''); setAdDescription(''); setAdImageUrl(''); setAdTargetUrl(''); setAdStartDate(''); setAdEndDate(''); }} className="bg-navy hover:bg-navy-light text-white">
                        <Megaphone className="w-4 h-4 me-2" />
                        {locale === 'ar' ? 'طلب' : 'Request'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          {loading ? (
            <div className="space-y-3 mt-4">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : adRequests.length === 0 ? (
            <div className="text-center py-16 text-sm text-muted-foreground">
              {locale === 'ar' ? 'لا يوجد سجل طلبات' : 'No request history'}
            </div>
          ) : (
            <div className="space-y-3 mt-4">
              {adRequests.map(req => (
                <Card key={req.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm">{req.title}</h4>
                          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', statusConfig[req.status]?.color)}>
                            {statusConfig[req.status]?.[locale === 'ar' ? 'ar' : 'en'] || req.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {locale === 'ar' ? req.ad_type_name : req.ad_type_name_en} | {formatDate(req.created_at, locale)}
                        </p>
                        {req.admin_note && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {locale === 'ar' ? 'ملاحظة' : 'Note'}: {req.admin_note}
                          </p>
                        )}
                      </div>
                      {(req.status === 'active' || req.status === 'expired') && (
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{req.impressions.toLocaleString()}</span>
                          <span className="flex items-center gap-1"><MousePointer className="w-3.5 h-3.5" />{req.clicks.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Request Dialog */}
      <Dialog open={!!requestDialog} onOpenChange={() => setRequestDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{locale === 'ar' ? 'طلب إعلان' : 'Request Ad'}</DialogTitle>
          </DialogHeader>
          {requestDialog && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-navy/10 flex items-center justify-center text-navy">
                  {placementIcons[requestDialog.placement_type] || <Megaphone className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-semibold text-sm">{locale === 'ar' ? requestDialog.name : requestDialog.name_en}</p>
                  <p className="text-xs text-muted-foreground">{formatPrice(requestDialog.price)}/{locale === 'ar' ? 'أسبوع' : 'week'}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{locale === 'ar' ? 'عنوان الإعلان' : 'Ad Title'} *</Label>
                <Input value={adTitle} onChange={(e) => setAdTitle(e.target.value)} placeholder={locale === 'ar' ? 'أدخل عنوان الإعلان' : 'Enter ad title'} />
              </div>
              <div className="space-y-2">
                <Label>{locale === 'ar' ? 'الوصف' : 'Description'}</Label>
                <Textarea value={adDescription} onChange={(e) => setAdDescription(e.target.value)} placeholder={locale === 'ar' ? 'وصف الإعلان...' : 'Ad description...'} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>{locale === 'ar' ? 'رابط الصورة' : 'Image URL'}</Label>
                <Input value={adImageUrl} onChange={(e) => setAdImageUrl(e.target.value)} placeholder="https://..." dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>{locale === 'ar' ? 'رابط الهدف' : 'Target URL'}</Label>
                <Input value={adTargetUrl} onChange={(e) => setAdTargetUrl(e.target.value)} placeholder="https://..." dir="ltr" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{locale === 'ar' ? 'تاريخ البداية' : 'Start Date'}</Label>
                  <Input type="date" value={adStartDate} onChange={(e) => setAdStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{locale === 'ar' ? 'تاريخ النهاية' : 'End Date'}</Label>
                  <Input type="date" value={adEndDate} onChange={(e) => setAdEndDate(e.target.value)} />
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setRequestDialog(null)}>
                  {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button onClick={handleSubmitAd} disabled={submitting} className="bg-navy hover:bg-navy-light text-white">
                  {submitting ? (locale === 'ar' ? 'جارٍ الإرسال...' : 'Submitting...') : (locale === 'ar' ? 'إرسال الطلب' : 'Submit Request')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
