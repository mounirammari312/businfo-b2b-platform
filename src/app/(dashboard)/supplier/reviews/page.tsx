'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLocaleStore } from '@/lib/store';
import { cn, formatDate } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
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
  Star,
  MessageSquare,
  Send,
  Filter,
} from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  title: string;
  comment: string;
  product_name: string;
  buyer_name: string;
  created_at: string;
  reply: string | null;
}

export default function Reviews() {
  const { locale } = useLocaleStore();
  const { supplier } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [ratingDist, setRatingDist] = useState<Record<number, number>>({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });

  useEffect(() => {
    if (supplier?.id) loadReviews();
  }, [supplier?.id]);

  const loadReviews = async () => {
    if (!supplier?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, products(name), profiles!reviews_buyer_id_fkey(display_name)')
        .eq('supplier_id', supplier.id)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map(r => ({
        id: r.id,
        rating: r.rating,
        title: r.title || '',
        comment: r.comment || '',
        product_name: (r.products as Record<string, string>)?.name || '',
        buyer_name: (r.profiles as Record<string, string>)?.display_name || '',
        created_at: r.created_at,
        reply: null,
      }));

      setReviews(mapped);
      setTotalReviews(mapped.length);

      if (mapped.length > 0) {
        const avg = mapped.reduce((sum, r) => sum + r.rating, 0) / mapped.length;
        setAvgRating(avg);
      }

      const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      mapped.forEach(r => { dist[r.rating] = (dist[r.rating] || 0) + 1; });
      setRatingDist(dist);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = ratingFilter === 'all' ? reviews : reviews.filter(r => r.rating === Number(ratingFilter));

  const handleReply = async () => {
    if (!selectedReview || !replyText.trim()) return;
    setSubmittingReply(true);
    try {
      // Reviews don't have a reply field in the schema, so we use the messages table
      const { error } = await supabase.from('messages').insert({
        from_user_id: supplier!.user_id,
        to_user_id: '', // The buyer's ID would need to be fetched
        subject: `رد على تقييم: ${selectedReview.title || selectedReview.product_name}`,
        body: replyText.trim(),
        message_type: 'general',
        related_id: selectedReview.id,
      });

      if (error) throw error;

      toast.success(locale === 'ar' ? 'تم إرسال الرد بنجاح' : 'Reply sent successfully');
      setSelectedReview(null);
      setReplyText('');
      setReviews(prev => prev.map(r => r.id === selectedReview.id ? { ...r, reply: replyText.trim() } : r));
    } catch (err) {
      toast.error(locale === 'ar' ? 'فشل إرسال الرد' : 'Failed to send reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{locale === 'ar' ? 'التقييمات' : 'Reviews'}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {locale === 'ar' ? `${totalReviews} تقييم` : `${totalReviews} reviews`}
        </p>
      </div>

      {/* Rating Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="text-center">
              <div className="text-5xl font-bold text-navy">{avgRating.toFixed(1)}</div>
              <div className="flex items-center gap-0.5 mt-2 justify-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={cn('w-5 h-5', i < Math.round(avgRating) ? 'fill-gold text-gold' : 'text-muted-foreground/30')} />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{totalReviews} {locale === 'ar' ? 'تقييم' : 'reviews'}</p>
            </div>
            <div className="flex-1 w-full space-y-2">
              {[5, 4, 3, 2, 1].map(star => {
                const count = ratingDist[star] || 0;
                const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-sm w-12 text-end">{star} <Star className="w-3 h-3 inline fill-gold text-gold" /></span>
                    <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-gold rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm text-muted-foreground w-8">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={locale === 'ar' ? 'تصفية حسب التقييم' : 'Filter by rating'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{locale === 'ar' ? 'جميع التقييمات' : 'All Ratings'}</SelectItem>
            {[5, 4, 3, 2, 1].map(s => (
              <SelectItem key={s} value={String(s)}>{s} {s === 1 ? (locale === 'ar' ? 'نجمة' : 'star') : (locale === 'ar' ? 'نجوم' : 'stars')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Star className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg">{locale === 'ar' ? 'لا توجد تقييمات' : 'No reviews'}</h3>
          <p className="text-muted-foreground text-sm mt-1">
            {locale === 'ar' ? 'ستظهر التقييمات هنا بعد تقييم المشترين لمنتجاتك' : 'Reviews will appear here after buyers rate your products'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map(review => (
            <Card key={review.id}>
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center shrink-0">
                    <span className="text-navy font-bold text-sm">
                      {review.buyer_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-semibold text-sm">{review.buyer_name}</span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={cn('w-3.5 h-3.5', i < review.rating ? 'fill-gold text-gold' : 'text-muted-foreground/30')} />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDate(review.created_at, locale)}</span>
                    </div>
                    {review.title && <h4 className="font-medium mt-2">{review.title}</h4>}
                    {review.comment && <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>}
                    <p className="text-xs text-navy mt-2">{review.product_name}</p>

                    {review.reply && (
                      <div className="mt-3 bg-muted/50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">
                          {locale === 'ar' ? 'رد المورد' : 'Supplier Reply'}
                        </p>
                        <p className="text-sm">{review.reply}</p>
                      </div>
                    )}

                    {!review.reply && (
                      <Button variant="ghost" size="sm" className="mt-2" onClick={() => { setSelectedReview(review); setReplyText(''); }}>
                        <MessageSquare className="w-4 h-4 me-2" />
                        {locale === 'ar' ? 'رد' : 'Reply'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reply Dialog */}
      <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{locale === 'ar' ? 'الرد على التقييم' : 'Reply to Review'}</DialogTitle>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-1 mb-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn('w-3.5 h-3.5', i < selectedReview.rating ? 'fill-gold text-gold' : 'text-muted-foreground/30')} />
                  ))}
                </div>
                {selectedReview.title && <p className="font-semibold text-sm">{selectedReview.title}</p>}
                {selectedReview.comment && <p className="text-sm text-muted-foreground mt-1">{selectedReview.comment}</p>}
              </div>
              <div className="space-y-2">
                <Label>{locale === 'ar' ? 'الرد' : 'Reply'}</Label>
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={locale === 'ar' ? 'اكتب ردك هنا...' : 'Write your reply here...'}
                  rows={4}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setSelectedReview(null)}>
                  {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button onClick={handleReply} disabled={submittingReply || !replyText.trim()} className="bg-navy hover:bg-navy-light text-white">
                  <Send className="w-4 h-4 me-2" />
                  {locale === 'ar' ? 'إرسال الرد' : 'Send Reply'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
