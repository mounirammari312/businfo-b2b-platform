'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLocaleStore, useCurrencyStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { cn, formatRelativeTime } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Pagination } from '@/components/shared';
import { CATEGORIES } from '@/lib/constants';
import { toast } from 'sonner';
import {
  FileText,
  Plus,
  Eye,
  Clock,
  MessageSquare,
  CalendarDays,
  Tag,
  DollarSign,
  Hash,
  CheckCircle2,
  XCircle,
  Building2,
  Reply,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface QuoteReply {
  id: string;
  supplier_id: string;
  supplier_name: string;
  price_per_unit: number;
  currency: string;
  message: string;
  delivery_time: string;
  status: string;
  created_at: string;
}

interface Quote {
  id: string;
  title: string;
  description?: string;
  category_id?: string;
  quantity?: number;
  unit?: string;
  budget_min?: number;
  budget_max?: number;
  currency: string;
  deadline?: string;
  status: string;
  created_at: string;
  replies_count?: number;
}

const quoteStatusConfig: Record<string, { ar: string; fr: string; color: string }> = {
  open: { ar: 'مفتوح', fr: 'Ouvert', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  replied: { ar: 'تم الرد', fr: 'Répondu', color: 'bg-green-100 text-green-800 border-green-200' },
  closed: { ar: 'مغلق', fr: 'Fermé', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  expired: { ar: 'منتهي', fr: 'Expiré', color: 'bg-red-100 text-red-800 border-red-200' },
};

const ITEMS_PER_PAGE = 8;

export default function BuyerQuotesPage() {
  const { user } = useAuth();
  const { locale } = useLocaleStore();
  const { formatPrice: storeFormatPrice } = useCurrencyStore();

  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [totalQuotes, setTotalQuotes] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [showNewForm, setShowNewForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [replies, setReplies] = useState<QuoteReply[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);

  // New quote form
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    quantity: '',
    unit: 'piece',
    budgetMin: '',
    budgetMax: '',
    deadline: '',
  });

  const totalPages = Math.ceil(totalQuotes / ITEMS_PER_PAGE);

  const loadQuotes = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, count, error } = await supabase
        .from('quotes')
        .select('id, title, description, quantity, unit, budget_min, budget_max, currency, deadline, status, created_at', { count: 'exact' })
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      setQuotes(data || []);
      setTotalQuotes(count || 0);
    } catch (err) {
      console.error('Error loading quotes:', err);
    } finally {
      setLoading(false);
    }
  }, [user, currentPage]);

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  const handleSubmitQuote = async () => {
    if (!user || !formData.title.trim()) {
      toast.error(locale === 'ar' ? 'يرجى إدخال العنوان' : 'Veuillez entrer le titre');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('quotes').insert({
        buyer_id: user.id,
        title: formData.title,
        description: formData.description || null,
        category_id: formData.category || null,
        quantity: formData.quantity ? parseInt(formData.quantity) : null,
        unit: formData.unit,
        budget_min: formData.budgetMin ? parseFloat(formData.budgetMin) : null,
        budget_max: formData.budgetMax ? parseFloat(formData.budgetMax) : null,
        deadline: formData.deadline || null,
        status: 'open',
      });

      if (error) throw error;

      toast.success(locale === 'ar' ? 'تم إرسال طلب عرض السعر بنجاح' : 'Demande de devis envoyee');
      setShowNewForm(false);
      setFormData({ title: '', description: '', category: '', quantity: '', unit: 'piece', budgetMin: '', budgetMax: '', deadline: '' });
      loadQuotes();
    } catch (err) {
      console.error('Error creating quote:', err);
      toast.error(locale === 'ar' ? 'حدث خطأ أثناء الإرسال' : 'Erreur lors de l\'envoi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewReplies = async (quote: Quote) => {
    setSelectedQuote(quote);
    setRepliesLoading(true);
    try {
      const { data } = await supabase
        .from('quote_replies')
        .select('id, supplier_id, price_per_unit, currency, message, delivery_time, status, created_at, suppliers(name)')
        .eq('quote_id', quote.id);

      setReplies(
        (data || []).map((r) => ({
          id: r.id,
          supplier_id: r.supplier_id,
          supplier_name: (r.suppliers as unknown as { name: string })?.name || '',
          price_per_unit: r.price_per_unit,
          currency: r.currency,
          message: r.message || '',
          delivery_time: r.delivery_time || '',
          status: r.status,
          created_at: r.created_at,
        }))
      );
    } catch (err) {
      console.error('Error loading replies:', err);
    } finally {
      setRepliesLoading(false);
    }
  };

  const getStatusLabel = (status: string) => quoteStatusConfig[status]?.[locale] || status;
  const getStatusColor = (status: string) => quoteStatusConfig[status]?.color || 'bg-gray-100 text-gray-800';

  const units = [
    { value: 'piece', label: locale === 'ar' ? 'قطعة' : 'Piece' },
    { value: 'box', label: locale === 'ar' ? 'صندوق' : 'Carton' },
    { value: 'kg', label: locale === 'ar' ? 'كيلوغرام' : 'Kg' },
    { value: 'ton', label: locale === 'ar' ? 'طن' : 'Tonne' },
    { value: 'meter', label: locale === 'ar' ? 'متر' : 'Metre' },
    { value: 'liter', label: locale === 'ar' ? 'لتر' : 'Litre' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            {locale === 'ar' ? 'طلبات عروض الأسعار' : 'Demandes de devis'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {locale === 'ar'
              ? `${totalQuotes} طلب عرض سعر`
              : `${totalQuotes} demande(s) de devis`}
          </p>
        </div>
        <Button
          onClick={() => setShowNewForm(true)}
          className="bg-navy hover:bg-navy-light text-white rounded-xl"
        >
          <Plus className="w-4 h-4 me-2" />
          {locale === 'ar' ? 'طلب عرض سعر جديد' : 'Nouveau devis'}
        </Button>
      </div>

      {/* Quote List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : quotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-5">
            <FileText className="w-10 h-10 text-muted-foreground/40" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {locale === 'ar' ? 'لا توجد طلبات عروض أسعار' : 'Aucune demande de devis'}
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            {locale === 'ar'
              ? 'أرسل طلب عرض سعر للحصول على عروض من الموردين'
              : 'Envoyez une demande de devis pour recevoir des offres des fournisseurs'}
          </p>
          <Button onClick={() => setShowNewForm(true)} className="bg-navy hover:bg-navy-light text-white rounded-xl">
            <Plus className="w-4 h-4 me-2" />
            {locale === 'ar' ? 'طلب عرض سعر جديد' : 'Nouveau devis'}
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quotes.map((quote) => (
              <Card key={quote.id} className="border-border hover:border-navy/20 hover:shadow-[var(--shadow-md)] transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0 mt-0.5">
                        <FileText className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground text-sm leading-snug truncate">
                          {quote.title}
                        </h3>
                        {quote.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {quote.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge className={cn('text-[10px] px-2 py-0 border font-medium shrink-0', getStatusColor(quote.status))}>
                      {getStatusLabel(quote.status)}
                    </Badge>
                  </div>

                  {/* Meta info */}
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                    {quote.quantity && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Hash className="w-3 h-3" />
                        <span>{quote.quantity} {quote.unit}</span>
                      </div>
                    )}
                    {quote.budget_max && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <DollarSign className="w-3 h-3" />
                        <span>{storeFormatPrice(quote.budget_max)}</span>
                      </div>
                    )}
                    {quote.deadline && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <CalendarDays className="w-3 h-3" />
                        <span>{new Date(quote.deadline).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'fr-DZ')}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{formatRelativeTime(quote.created_at, locale)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-navy"
                      onClick={() => handleViewReplies(quote)}
                    >
                      <Reply className="w-3.5 h-3.5 me-1" />
                      {locale === 'ar' ? 'عرض الردود' : 'Voir les reponses'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {!loading && quotes.length > 0 && totalPages > 1 && (
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          )}
        </>
      )}

      {/* New Quote Dialog */}
      <Dialog open={showNewForm} onOpenChange={setShowNewForm}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-navy" />
              {locale === 'ar' ? 'طلب عرض سعر جديد' : 'Nouvelle demande de devis'}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-4 pb-4">
              <div className="space-y-2">
                <Label>{locale === 'ar' ? 'العنوان' : 'Titre'} *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={locale === 'ar' ? 'مثال: توريد مواد بناء' : 'Ex: Fourniture materiaux construction'}
                />
              </div>

              <div className="space-y-2">
                <Label>{locale === 'ar' ? 'الوصف' : 'Description'}</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={locale === 'ar' ? 'وصف تفصيلي للمنتجات المطلوبة...' : 'Description detaillee des produits recherches...'}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>{locale === 'ar' ? 'التصنيف' : 'Categorie'}</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder={locale === 'ar' ? 'اختر التصنيف' : 'Choisir une categorie'} />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.filter(c => c.key !== 'all').map((cat) => (
                      <SelectItem key={cat.key} value={cat.key}>
                        {locale === 'ar' ? cat.labelAr : cat.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{locale === 'ar' ? 'الكمية' : 'Quantite'}</Label>
                  <Input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{locale === 'ar' ? 'الوحدة' : 'Unite'}</Label>
                  <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((u) => (
                        <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{locale === 'ar' ? 'الميزانية الدنيا' : 'Budget min.'}</Label>
                  <Input
                    type="number"
                    value={formData.budgetMin}
                    onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{locale === 'ar' ? 'الميزانية القصوى' : 'Budget max.'}</Label>
                  <Input
                    type="number"
                    value={formData.budgetMax}
                    onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                    placeholder="100000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{locale === 'ar' ? 'الموعد النهائي' : 'Date limite'}</Label>
                <Input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowNewForm(false)}
                >
                  {locale === 'ar' ? 'إلغاء' : 'Annuler'}
                </Button>
                <Button
                  className="flex-1 bg-navy hover:bg-navy-light text-white"
                  onClick={handleSubmitQuote}
                  disabled={submitting}
                >
                  {submitting
                    ? (locale === 'ar' ? 'جارٍ الإرسال...' : 'Envoi...')
                    : (locale === 'ar' ? 'إرسال الطلب' : 'Envoyer')}
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Replies Dialog */}
      <Dialog open={!!selectedQuote} onOpenChange={() => setSelectedQuote(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Reply className="w-5 h-5 text-navy" />
              {selectedQuote?.title}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-4 pb-4">
              {selectedQuote && (
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    {selectedQuote.quantity && (
                      <div className="flex items-center gap-1.5">
                        <Hash className="w-3 h-3" />
                        <span>{selectedQuote.quantity} {selectedQuote.unit}</span>
                      </div>
                    )}
                    {selectedQuote.budget_max && (
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3 h-3" />
                        <span>{storeFormatPrice(selectedQuote.budget_max)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {repliesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-lg" />
                  ))}
                </div>
              ) : replies.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {locale === 'ar' ? 'لا توجد ردود بعد' : 'Aucune reponse pour le moment'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {replies.map((reply) => (
                    <div key={reply.id} className="p-4 rounded-lg border border-border hover:border-navy/20 transition-colors">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-navy" />
                          <span className="text-sm font-semibold">{reply.supplier_name}</span>
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {formatRelativeTime(reply.created_at, locale)}
                        </span>
                      </div>

                      {reply.price_per_unit && (
                        <div className="flex items-center gap-2 mb-3">
                          <Tag className="w-3.5 h-3.5 text-green-600" />
                          <span className="text-sm font-bold text-green-600">
                            {storeFormatPrice(reply.price_per_unit)}
                          </span>
                          <span className="text-xs text-muted-foreground">/ {locale === 'ar' ? 'وحدة' : 'unite'}</span>
                        </div>
                      )}

                      {reply.message && (
                        <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{reply.message}</p>
                      )}

                      {reply.delivery_time && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{reply.delivery_time}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                        <Button size="sm" variant="outline" className="text-xs text-green-600 border-green-200 hover:bg-green-50">
                          <CheckCircle2 className="w-3.5 h-3.5 me-1" />
                          {locale === 'ar' ? 'قبول' : 'Accepter'}
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs text-red-600 border-red-200 hover:bg-red-50">
                          <XCircle className="w-3.5 h-3.5 me-1" />
                          {locale === 'ar' ? 'رفض' : 'Refuser'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
