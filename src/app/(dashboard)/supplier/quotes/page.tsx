'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLocaleStore } from '@/lib/store';
import { formatPrice, formatDate, cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
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
  FileText,
  Send,
  Clock,
  CheckCircle,
  MessageSquare,
  Calendar,
  DollarSign,
  User,
} from 'lucide-react';

interface Quote {
  id: string;
  buyer_name: string;
  title: string;
  description: string;
  category_name: string;
  quantity: number;
  unit: string;
  budget_min: number | null;
  budget_max: number | null;
  currency: string;
  deadline: string | null;
  status: string;
  created_at: string;
  has_replied: boolean;
}

export default function QuoteReplies() {
  const { locale } = useLocaleStore();
  const { supplier } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [replyPrice, setReplyPrice] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [replyDelivery, setReplyDelivery] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadQuotes = useCallback(async () => {
    if (!supplier?.id) return;
    setLoading(true);
    try {
      // Load quotes in supplier's categories that are still open
      const { data: quoteData, error } = await supabase
        .from('quotes')
        .select('*, profiles!quotes_buyer_id_fkey(display_name), categories(name, name_en), quote_replies(id)')
        .eq('status', 'open')
        .or(`category_id.is.null,category_id.in.(${supplier.category || ''})`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Also load quotes the supplier has already replied to
      const { data: repliedQuotes } = await supabase
        .from('quote_replies')
        .select('*, quotes(*, profiles!quotes_buyer_id_fkey(display_name), categories(name, name_en))')
        .eq('supplier_id', supplier.id);

      const repliedQuoteIds = new Set((repliedQuotes || []).map(r => r.quote_id));

      const allQuotes: Quote[] = (quoteData || []).map(q => {
        const cat = q.categories as Record<string, string> | null;
        return {
          id: q.id,
          buyer_name: (q.profiles as Record<string, string>)?.display_name || '—',
          title: q.title,
          description: q.description || '',
          category_name: locale === 'ar' ? cat?.name : cat?.name_en || '—',
          quantity: q.quantity || 0,
          unit: q.unit || '',
          budget_min: q.budget_min ? Number(q.budget_min) : null,
          budget_max: q.budget_max ? Number(q.budget_max) : null,
          currency: q.currency || 'DZD',
          deadline: q.deadline || null,
          status: q.status,
          created_at: q.created_at,
          has_replied: repliedQuoteIds.has(q.id),
        };
      });

      setQuotes(allQuotes);
    } catch (err) {
      console.error('Failed to load quotes:', err);
    } finally {
      setLoading(false);
    }
  }, [supplier?.id, supplier?.category, locale]);

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  const pendingQuotes = quotes.filter(q => !q.has_replied);
  const repliedQuotes = quotes.filter(q => q.has_replied);

  const displayQuotes = activeTab === 'pending' ? pendingQuotes : activeTab === 'replied' ? repliedQuotes : quotes;

  const handleReply = async () => {
    if (!selectedQuote || !supplier?.id) return;
    if (!replyPrice || Number(replyPrice) <= 0) {
      toast.error(locale === 'ar' ? 'أدخل السعر' : 'Enter a price');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('quote_replies').insert({
        quote_id: selectedQuote.id,
        supplier_id: supplier.id,
        price_per_unit: Number(replyPrice),
        currency: selectedQuote.currency,
        message: replyMessage.trim() || null,
        delivery_time: replyDelivery.trim() || null,
      });

      if (error) throw error;

      // Update quote status
      await supabase.from('quotes').update({ status: 'replied', updated_at: new Date().toISOString() }).eq('id', selectedQuote.id);

      toast.success(locale === 'ar' ? 'تم إرسال الرد بنجاح' : 'Reply sent successfully');
      setSelectedQuote(null);
      setReplyPrice('');
      setReplyMessage('');
      setReplyDelivery('');
      loadQuotes();
    } catch (err) {
      console.error(err);
      toast.error(locale === 'ar' ? 'فشل إرسال الرد' : 'Failed to send reply');
    } finally {
      setSubmitting(false);
    }
  };

  const openReplyDialog = (quote: Quote) => {
    setSelectedQuote(quote);
    setReplyPrice('');
    setReplyMessage('');
    setReplyDelivery('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{locale === 'ar' ? 'طلبات العروض' : 'Quote Requests'}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {locale === 'ar' ? 'استجب لطلبات العروض من المشترين' : 'Respond to quote requests from buyers'}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            {locale === 'ar' ? 'قيد الانتظار' : 'Pending'} ({pendingQuotes.length})
          </TabsTrigger>
          <TabsTrigger value="replied">
            {locale === 'ar' ? 'تم الرد' : 'Replied'} ({repliedQuotes.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            {locale === 'ar' ? 'الكل' : 'All'} ({quotes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {loading ? (
            <div className="space-y-4 mt-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : displayQuotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg">{locale === 'ar' ? 'لا توجد طلبات عروض' : 'No quote requests'}</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {locale === 'ar' ? 'ستظهر طلبات العروض هنا' : 'Quote requests will appear here'}
              </p>
            </div>
          ) : (
            <div className="space-y-4 mt-4">
              {displayQuotes.map((quote) => (
                <Card key={quote.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-lg">{quote.title}</h3>
                            {quote.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{quote.description}</p>
                            )}
                          </div>
                          {quote.has_replied ? (
                            <Badge className="bg-green-100 text-green-800 shrink-0">
                              <CheckCircle className="w-3 h-3 me-1" />
                              {locale === 'ar' ? 'تم الرد' : 'Replied'}
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800 shrink-0">
                              <Clock className="w-3 h-3 me-1" />
                              {locale === 'ar' ? 'قيد الانتظار' : 'Pending'}
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" />
                            <span>{quote.buyer_name}</span>
                          </div>
                          {quote.category_name && quote.category_name !== '—' && (
                            <span className="font-medium">{quote.category_name}</span>
                          )}
                          <div className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" />
                            <span>{locale === 'ar' ? 'الكمية' : 'Qty'}: {quote.quantity} {quote.unit}</span>
                          </div>
                          {(quote.budget_min || quote.budget_max) && (
                            <div className="flex items-center gap-1.5">
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>
                                {quote.budget_min && quote.budget_max
                                  ? `${formatPrice(quote.budget_min, quote.currency)} - ${formatPrice(quote.budget_max, quote.currency)}`
                                  : quote.budget_min
                                    ? `${locale === 'ar' ? 'من' : 'From'} ${formatPrice(quote.budget_min, quote.currency)}`
                                    : `${locale === 'ar' ? 'حتى' : 'Up to'} ${formatPrice(quote.budget_max, quote.currency)}`
                                }
                              </span>
                            </div>
                          )}
                          {quote.deadline && (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{formatDate(quote.deadline, locale)}</span>
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground">{formatDate(quote.created_at, locale)}</p>
                      </div>

                      {!quote.has_replied && (
                        <Button onClick={() => openReplyDialog(quote)} className="bg-navy hover:bg-navy-light text-white shrink-0">
                          <Send className="w-4 h-4 me-2" />
                          {locale === 'ar' ? 'إرسال عرض' : 'Send Quote'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Reply Dialog */}
      <Dialog open={!!selectedQuote && !selectedQuote?.has_replied} onOpenChange={() => setSelectedQuote(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{locale === 'ar' ? 'إرسال عرض سعر' : 'Send Price Quote'}</DialogTitle>
          </DialogHeader>
          {selectedQuote && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <p className="font-semibold">{selectedQuote.title}</p>
                <p className="text-muted-foreground mt-1">
                  {locale === 'ar' ? 'الكمية' : 'Qty'}: {selectedQuote.quantity} {selectedQuote.unit}
                  {selectedQuote.budget_min && ` | ${locale === 'ar' ? 'الميزانية' : 'Budget'}: ${formatPrice(selectedQuote.budget_min, selectedQuote.currency)}`}
                </p>
              </div>

              <div className="space-y-2">
                <Label>{locale === 'ar' ? 'السعر للوحدة الواحدة' : 'Price Per Unit'} *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={replyPrice}
                  onChange={(e) => setReplyPrice(e.target.value)}
                  placeholder="0.00"
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label>{locale === 'ar' ? 'مدة التسليم' : 'Delivery Time'}</Label>
                <Input
                  value={replyDelivery}
                  onChange={(e) => setReplyDelivery(e.target.value)}
                  placeholder={locale === 'ar' ? 'مثلاً: 3-5 أيام عمل' : 'e.g. 3-5 business days'}
                />
              </div>

              <div className="space-y-2">
                <Label>{locale === 'ar' ? 'رسالة' : 'Message'}</Label>
                <Textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder={locale === 'ar' ? 'أضف ملاحظات أو تفاصيل إضافية...' : 'Add notes or additional details...'}
                  rows={3}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setSelectedQuote(null)}>
                  {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button onClick={handleReply} disabled={submitting} className="bg-navy hover:bg-navy-light text-white">
                  {submitting ? (
                    <>{locale === 'ar' ? 'جارٍ الإرسال...' : 'Sending...'}</>
                  ) : (
                    <><Send className="w-4 h-4 me-2" />{locale === 'ar' ? 'إرسال العرض' : 'Send Quote'}</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
