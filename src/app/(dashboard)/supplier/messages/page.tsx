'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLocaleStore } from '@/lib/store';
import { formatRelativeTime, cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  MessageCircle,
  Search,
  Trash2,
  User,
  Clock,
} from 'lucide-react';

interface Message {
  id: string;
  from_name: string;
  from_id: string;
  subject: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export default function Messages() {
  const { locale } = useLocaleStore();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  useEffect(() => {
    if (user?.id) loadMessages();
  }, [user?.id]);

  const loadMessages = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('messages')
        .select('*, profiles!messages_from_user_id_fkey(display_name)')
        .eq('to_user_id', user.id)
        .order('created_at', { ascending: false });

      setMessages((data || []).map(m => ({
        id: m.id,
        from_name: (m.profiles as Record<string, string>)?.display_name || (locale === 'ar' ? 'مستخدم' : 'User'),
        from_id: m.from_user_id,
        subject: m.subject || (locale === 'ar' ? 'بدون عنوان' : 'No Subject'),
        body: m.body,
        is_read: m.is_read,
        created_at: m.created_at,
      })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (msg: Message) => {
    try {
      await supabase.from('messages').update({ is_read: true }).eq('id', msg.id);
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m));
      setSelectedMessage(prev => prev ? { ...prev, is_read: true } : null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (msgId: string) => {
    try {
      await supabase.from('messages').delete().eq('id', msgId);
      toast.success(locale === 'ar' ? 'تم حذف الرسالة' : 'Message deleted');
      setMessages(prev => prev.filter(m => m.id !== msgId));
      setSelectedMessage(null);
    } catch (err) {
      toast.error(locale === 'ar' ? 'فشل حذف الرسالة' : 'Failed to delete');
    }
  };

  const filtered = messages.filter(m => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return m.subject.toLowerCase().includes(s) || m.body.toLowerCase().includes(s) || m.from_name.toLowerCase().includes(s);
  });

  const unreadCount = messages.filter(m => !m.is_read).length;

  const openMessage = async (msg: Message) => {
    setSelectedMessage(msg);
    if (!msg.is_read) {
      await handleMarkRead(msg);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{locale === 'ar' ? 'المراسلة' : 'Messages'}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} ${locale === 'ar' ? 'رسائل غير مقروءة' : 'unread messages'}` : (locale === 'ar' ? 'لا توجد رسائل جديدة' : 'No new messages')}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={locale === 'ar' ? 'ابحث في الرسائل...' : 'Search messages...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-10"
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <MessageCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg">{locale === 'ar' ? 'لا توجد رسائل' : 'No messages'}</h3>
          <p className="text-muted-foreground text-sm mt-1">
            {locale === 'ar' ? 'ستظهر الرسائل هنا' : 'Messages will appear here'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(msg => (
            <Card
              key={msg.id}
              className={cn('cursor-pointer hover:shadow-md transition-shadow', !msg.is_read && 'border-navy/30 bg-navy/[0.02]')}
              onClick={() => openMessage(msg)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-navy" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn('text-sm truncate', !msg.is_read ? 'font-bold' : 'font-medium')}>{msg.from_name}</p>
                    {!msg.is_read && <div className="w-2 h-2 rounded-full bg-navy shrink-0" />}
                  </div>
                  <p className={cn('text-sm truncate', !msg.is_read ? 'font-semibold' : 'text-muted-foreground')}>{msg.subject}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{msg.body}</p>
                </div>
                <div className="text-xs text-muted-foreground shrink-0 flex flex-col items-end gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatRelativeTime(msg.created_at, locale)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedMessage?.subject}</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                <span>{selectedMessage.from_name}</span>
                <span className="mx-1">|</span>
                <Clock className="w-4 h-4" />
                <span>{formatRelativeTime(selectedMessage.created_at, locale)}</span>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-sm leading-relaxed">
                {selectedMessage.body}
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDelete(selectedMessage.id)}>
                  <Trash2 className="w-4 h-4 me-2" />
                  {locale === 'ar' ? 'حذف' : 'Delete'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
