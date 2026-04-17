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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Award,
  Shield,
  Star,
  Crown,
  CheckCircle,
  Clock,
  XCircle,
  Send,
  Sparkles,
  BadgeCheck,
} from 'lucide-react';

interface BadgeType {
  id: string;
  name: string;
  name_en: string;
  slug: string;
  icon: string;
  color: string;
  description: string;
  description_en: string;
  price: number;
  is_active: boolean;
}

interface BadgeRequest {
  id: string;
  badge_type_id: string;
  badge_name: string;
  badge_name_en: string;
  badge_icon: string;
  badge_color: string;
  status: string;
  message: string;
  admin_note: string;
  created_at: string;
}

interface ActiveBadge {
  id: string;
  badge_name: string;
  badge_name_en: string;
  badge_icon: string;
  badge_color: string;
  activated_at: string;
  expires_at: string | null;
}

const statusConfig: Record<string, { ar: string; en: string; color: string; icon: React.ReactNode }> = {
  pending: { ar: 'قيد الانتظار', en: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-3.5 h-3.5" /> },
  approved: { ar: 'مقبول', en: 'Approved', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  rejected: { ar: 'مرفوض', en: 'Rejected', color: 'bg-red-100 text-red-800', icon: <XCircle className="w-3.5 h-3.5" /> },
};

const badgeIcons: Record<string, React.ReactNode> = {
  verified: <BadgeCheck className="w-6 h-6" />,
  gold: <Crown className="w-6 h-6" />,
  premium: <Sparkles className="w-6 h-6" />,
  trusted: <Shield className="w-6 h-6" />,
  top_seller: <Star className="w-6 h-6" />,
  default: <Award className="w-6 h-6" />,
};

export default function BadgeRequests() {
  const { locale } = useLocaleStore();
  const { supplier } = useAuth();
  const [badgeTypes, setBadgeTypes] = useState<BadgeType[]>([]);
  const [activeBadges, setActiveBadges] = useState<ActiveBadge[]>([]);
  const [badgeRequests, setBadgeRequests] = useState<BadgeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestDialog, setRequestDialog] = useState<BadgeType | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [supplier?.id]);

  const loadData = async () => {
    if (!supplier?.id) return;
    setLoading(true);
    try {
      const { data: types } = await supabase.from('badge_types').select('*').eq('is_active', true).order('price');
      setBadgeTypes((types || []).map(t => ({
        id: t.id, name: t.name, name_en: t.name_en, slug: t.slug, icon: t.icon,
        color: t.color, description: t.description, description_en: t.description_en,
        price: Number(t.price), is_active: t.is_active,
      })));

      const { data: active } = await supabase
        .from('supplier_badges')
        .select('*, badge_types(name, name_en, icon, color)')
        .eq('supplier_id', supplier.id)
        .eq('is_active', true);

      setActiveBadges((active || []).map(a => ({
        id: a.id,
        badge_name: (a.badge_types as Record<string, string>)?.name || '',
        badge_name_en: (a.badge_types as Record<string, string>)?.name_en || '',
        badge_icon: (a.badge_types as Record<string, string>)?.icon || '',
        badge_color: (a.badge_types as Record<string, string>)?.color || '',
        activated_at: a.activated_at,
        expires_at: a.expires_at,
      })));

      const { data: requests } = await supabase
        .from('badge_requests')
        .select('*, badge_types(name, name_en, icon, color)')
        .eq('supplier_id', supplier.id)
        .order('created_at', { ascending: false });

      setBadgeRequests((requests || []).map(r => ({
        id: r.id,
        badge_type_id: r.badge_type_id,
        badge_name: (r.badge_types as Record<string, string>)?.name || '',
        badge_name_en: (r.badge_types as Record<string, string>)?.name_en || '',
        badge_icon: (r.badge_types as Record<string, string>)?.icon || '',
        badge_color: (r.badge_types as Record<string, string>)?.color || '',
        status: r.status,
        message: r.message || '',
        admin_note: r.admin_note || '',
        created_at: r.created_at,
      })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestBadge = async () => {
    if (!requestDialog || !supplier?.id) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('badge_requests').insert({
        supplier_id: supplier.id,
        badge_type_id: requestDialog.id,
        message: requestMessage.trim() || null,
      });

      if (error) throw error;
      toast.success(locale === 'ar' ? 'تم إرسال طلب الشارة' : 'Badge request submitted');
      setRequestDialog(null);
      setRequestMessage('');
      loadData();
    } catch (err) {
      toast.error(locale === 'ar' ? 'فشل إرسال الطلب' : 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const getBadgeIcon = (icon: string) => {
    return badgeIcons[icon] || badgeIcons.default;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{locale === 'ar' ? 'طلب شارة' : 'Badge Requests'}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {locale === 'ar' ? 'اطلب شارات احترافية لتعزيز متجرك' : 'Request professional badges to enhance your store'}
        </p>
      </div>

      {/* Active Badges */}
      {activeBadges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              {locale === 'ar' ? 'الشارات النشطة' : 'Active Badges'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeBadges.map(badge => (
                <div key={badge.id} className="flex items-center gap-3 p-4 rounded-lg border-2 border-green-200 bg-green-50/50">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm" style={{ color: badge.badge_color || '#1B3A5C' }}>
                    {getBadgeIcon(badge.badge_icon)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{locale === 'ar' ? badge.badge_name : badge.badge_name_en}</p>
                    <p className="text-xs text-muted-foreground">
                      {locale === 'ar' ? 'مفعّلة منذ' : 'Active since'} {formatDate(badge.activated_at, locale)}
                    </p>
                    {badge.expires_at && (
                      <p className="text-xs text-muted-foreground">
                        {locale === 'ar' ? 'تنتهي' : 'Expires'}: {formatDate(badge.expires_at, locale)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="available">
        <TabsList>
          <TabsTrigger value="available">{locale === 'ar' ? 'الشارات المتاحة' : 'Available Badges'}</TabsTrigger>
          <TabsTrigger value="history">{locale === 'ar' ? 'سجل الطلبات' : 'Request History'} ({badgeRequests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="available">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
            </div>
          ) : badgeTypes.length === 0 ? (
            <div className="text-center py-16 text-sm text-muted-foreground">
              {locale === 'ar' ? 'لا توجد شارات متاحة حالياً' : 'No badges available at this time'}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {badgeTypes.map(badge => {
                const isActive = activeBadges.some(ab => ab.badge_name === badge.name);
                const hasPending = badgeRequests.some(br => br.badge_type_id === badge.id && br.status === 'pending');
                return (
                  <Card key={badge.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4" style={{ backgroundColor: `${badge.color}15`, color: badge.color }}>
                        {getBadgeIcon(badge.icon)}
                      </div>
                      <h3 className="font-bold text-lg">{locale === 'ar' ? badge.name : badge.name_en}</h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        {locale === 'ar' ? badge.description : badge.description_en}
                      </p>
                      <p className="text-lg font-bold text-navy mt-3">{formatPrice(badge.price)}/<span className="text-xs text-muted-foreground font-normal">{locale === 'ar' ? 'شهر' : 'month'}</span></p>

                      <Button
                        className="w-full mt-4"
                        variant={isActive ? 'outline' : 'default'}
                        disabled={isActive || hasPending}
                        onClick={() => { setRequestDialog(badge); setRequestMessage(''); }}
                      >
                        {isActive ? (
                          <><CheckCircle className="w-4 h-4 me-2 text-green-600" />{locale === 'ar' ? 'مفعّلة' : 'Active'}</>
                        ) : hasPending ? (
                          <><Clock className="w-4 h-4 me-2" />{locale === 'ar' ? 'قيد المراجعة' : 'Under Review'}</>
                        ) : (
                          <><Award className="w-4 h-4 me-2" />{locale === 'ar' ? 'طلب الشارة' : 'Request Badge'}</>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          {loading ? (
            <div className="space-y-3 mt-4">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : badgeRequests.length === 0 ? (
            <div className="text-center py-16 text-sm text-muted-foreground">
              {locale === 'ar' ? 'لا يوجد سجل طلبات' : 'No request history'}
            </div>
          ) : (
            <div className="space-y-3 mt-4">
              {badgeRequests.map(req => (
                <Card key={req.id}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center" style={{ color: req.badge_color }}>
                      {getBadgeIcon(req.badge_icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{locale === 'ar' ? req.badge_name : req.badge_name_en}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(req.created_at, locale)}</p>
                      {req.admin_note && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {locale === 'ar' ? 'ملاحظة الإدارة' : 'Admin note'}: {req.admin_note}
                        </p>
                      )}
                    </div>
                    <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', statusConfig[req.status]?.color)}>
                      {statusConfig[req.status]?.[locale === 'ar' ? 'ar' : 'en'] || req.status}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Request Dialog */}
      <Dialog open={!!requestDialog} onOpenChange={() => setRequestDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{locale === 'ar' ? 'طلب شارة' : 'Request Badge'}</DialogTitle>
          </DialogHeader>
          {requestDialog && (
            <div className="space-y-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-2" style={{ backgroundColor: `${requestDialog.color}15`, color: requestDialog.color }}>
                  {getBadgeIcon(requestDialog.icon)}
                </div>
                <p className="font-bold">{locale === 'ar' ? requestDialog.name : requestDialog.name_en}</p>
                <p className="text-sm text-navy font-semibold">{formatPrice(requestDialog.price)}/{locale === 'ar' ? 'شهر' : 'month'}</p>
              </div>

              <div className="space-y-2">
                <Label>{locale === 'ar' ? 'رسالة (اختياري)' : 'Message (optional)'}</Label>
                <Textarea
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder={locale === 'ar' ? 'أضف أي معلومات إضافية...' : 'Add any additional information...'}
                  rows={3}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setRequestDialog(null)}>
                  {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button onClick={handleRequestBadge} disabled={submitting} className="bg-navy hover:bg-navy-light text-white">
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
