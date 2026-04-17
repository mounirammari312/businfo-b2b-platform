'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLocaleStore } from '@/lib/store';
import { cn, getInitials, formatRelativeTime } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MessageCircle,
  Send,
  Search,
  Filter,
  Paperclip,
  Inbox,
  User,
  Circle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Conversation {
  conversation_id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar?: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  message_type: string;
  subject?: string;
}

interface ChatMessage {
  id: string;
  from_user_id: string;
  to_user_id: string;
  body: string;
  is_read: boolean;
  created_at: string;
  from_display_name?: string;
  from_avatar_url?: string;
}

export default function BuyerMessagesPage() {
  const { user, profile } = useAuth();
  const { locale } = useLocaleStore();

  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Get all messages where user is sender or receiver
      const { data: sentMsgs } = await supabase
        .from('messages')
        .select('conversation_id, to_user_id, body, created_at, is_read, message_type, subject, profiles!messages_to_user_id_fkey(display_name, avatar_url)')
        .eq('from_user_id', user.id);

      const { data: receivedMsgs } = await supabase
        .from('messages')
        .select('conversation_id, from_user_id, body, created_at, is_read, message_type, subject, profiles!messages_from_user_id_fkey(display_name, avatar_url)')
        .eq('to_user_id', user.id);

      const allMessages = [
        ...(sentMsgs || []).map((m) => ({
          conversation_id: m.conversation_id,
          other_user_id: m.to_user_id,
          other_user_name: (m.profiles as unknown as { display_name: string })?.display_name || '',
          other_user_avatar: (m.profiles as unknown as { avatar_url: string })?.avatar_url || undefined,
          body: m.body,
          created_at: m.created_at,
          is_read: m.is_read,
          message_type: m.message_type,
          subject: m.subject || undefined,
          direction: 'sent' as const,
        })),
        ...(receivedMsgs || []).map((m) => ({
          conversation_id: m.conversation_id,
          other_user_id: m.from_user_id,
          other_user_name: (m.profiles as unknown as { display_name: string })?.display_name || '',
          other_user_avatar: (m.profiles as unknown as { avatar_url: string })?.avatar_url || undefined,
          body: m.body,
          created_at: m.created_at,
          is_read: m.is_read,
          message_type: m.message_type,
          subject: m.subject || undefined,
          direction: 'received' as const,
        })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Group by conversation_id
      const convMap = new Map<string, Conversation>();
      for (const msg of allMessages) {
        const existing = convMap.get(msg.conversation_id);
        if (!existing) {
          convMap.set(msg.conversation_id, {
            conversation_id: msg.conversation_id,
            other_user_id: msg.other_user_id,
            other_user_name: msg.other_user_name,
            other_user_avatar: msg.other_user_avatar,
            last_message: msg.body,
            last_message_time: msg.created_at,
            unread_count: msg.direction === 'received' && !msg.is_read ? 1 : 0,
            message_type: msg.message_type,
            subject: msg.subject,
          });
        } else {
          // Update last message if this one is newer
          if (new Date(msg.created_at) > new Date(existing.last_message_time)) {
            existing.last_message = msg.body;
            existing.last_message_time = msg.created_at;
          }
          if (msg.direction === 'received' && !msg.is_read) {
            existing.unread_count += 1;
          }
        }
      }

      let convList = Array.from(convMap.values());

      // Apply filters
      if (typeFilter !== 'all') {
        convList = convList.filter((c) => c.message_type === typeFilter);
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        convList = convList.filter((c) =>
          c.other_user_name.toLowerCase().includes(q) ||
          c.last_message.toLowerCase().includes(q)
        );
      }

      setConversations(convList);
    } catch (err) {
      console.error('Error loading conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [user, typeFilter, searchQuery]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const loadMessages = useCallback(async (conv: Conversation) => {
    setMessagesLoading(true);
    setSelectedConv(conv);
    try {
      const { data } = await supabase
        .from('messages')
        .select('id, from_user_id, to_user_id, body, is_read, created_at, from_display_name, profiles!messages_from_user_id_fkey(display_name, avatar_url)')
        .eq('conversation_id', conv.conversation_id)
        .order('created_at', { ascending: true });

      setMessages(
        (data || []).map((m) => ({
          id: m.id,
          from_user_id: m.from_user_id,
          to_user_id: m.to_user_id,
          body: m.body,
          is_read: m.is_read,
          created_at: m.created_at,
          from_display_name: (m.profiles as unknown as { display_name: string })?.display_name || '',
          from_avatar_url: (m.profiles as unknown as { avatar_url: string })?.avatar_url || undefined,
        }))
      );

      // Mark messages as read
      if (user) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('conversation_id', conv.conversation_id)
          .eq('to_user_id', user.id)
          .eq('is_read', false);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (selectedConv) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, selectedConv]);

  const handleSend = async () => {
    if (!user || !selectedConv || !newMessage.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: selectedConv.conversation_id,
        from_user_id: user.id,
        to_user_id: selectedConv.other_user_id,
        body: newMessage.trim(),
        is_read: false,
        message_type: selectedConv.message_type,
      });

      if (error) throw error;

      setMessages((prev) => [
        ...prev,
        {
          id: `temp-${Date.now()}`,
          from_user_id: user.id,
          to_user_id: selectedConv.other_user_id,
          body: newMessage.trim(),
          is_read: true,
          created_at: new Date().toISOString(),
          from_display_name: profile?.displayName || '',
        },
      ]);

      setNewMessage('');
      loadConversations();
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error(locale === 'ar' ? 'فشل في إرسال الرسالة' : 'Erreur d\'envoi');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            {locale === 'ar' ? 'المراسلة' : 'Messages'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {locale === 'ar'
              ? `${conversations.length} محادثة`
              : `${conversations.length} conversation(s)`}
          </p>
        </div>
      </div>

      {/* Chat Layout */}
      <Card className="border-border overflow-hidden" style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}>
        <div className="flex h-full">
          {/* Conversations List - Left Panel */}
          <div className={cn(
            'w-full md:w-80 lg:w-96 border-e border-border flex flex-col shrink-0',
            selectedConv ? 'hidden md:flex' : 'flex'
          )}>
            {/* Search & Filter */}
            <div className="p-3 border-b border-border space-y-2">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={locale === 'ar' ? 'بحث في المحادثات...' : 'Rechercher...'}
                  className="ps-9 h-9 text-sm"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-9 text-sm">
                  <Filter className="w-3.5 h-3.5 me-1.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{locale === 'ar' ? 'الكل' : 'Tous'}</SelectItem>
                  <SelectItem value="product_inquiry">{locale === 'ar' ? 'استفسار عن منتج' : 'Recherche produit'}</SelectItem>
                  <SelectItem value="general">{locale === 'ar' ? 'عام' : 'General'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Conversation List */}
            <ScrollArea className="flex-1">
              {loading ? (
                <div className="space-y-1 p-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3">
                      <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <Inbox className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground text-center">
                    {locale === 'ar' ? 'لا توجد محادثات' : 'Aucune conversation'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {conversations.map((conv) => (
                    <button
                      key={conv.conversation_id}
                      onClick={() => loadMessages(conv)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 text-start hover:bg-muted/50 transition-colors',
                        selectedConv?.conversation_id === conv.conversation_id && 'bg-muted/70'
                      )}
                    >
                      <div className="relative shrink-0">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={conv.other_user_avatar} />
                          <AvatarFallback className="bg-navy/10 text-xs text-navy font-semibold">
                            {getInitials(conv.other_user_name)}
                          </AvatarFallback>
                        </Avatar>
                        {conv.unread_count > 0 && (
                          <span className="absolute -top-0.5 -end-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                            {conv.unread_count > 9 ? '9+' : conv.unread_count}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={cn('text-sm truncate', conv.unread_count > 0 ? 'font-bold text-foreground' : 'font-medium text-foreground')}>
                            {conv.other_user_name || locale === 'ar' ? 'مستخدم' : 'Utilisateur'}
                          </p>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {formatRelativeTime(conv.last_message_time, locale)}
                          </span>
                        </div>
                        <p className={cn('text-xs truncate mt-0.5', conv.unread_count > 0 ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                          {conv.last_message}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Chat View - Right Panel */}
          <div className={cn(
            'flex-1 flex flex-col',
            !selectedConv ? 'hidden md:flex' : 'flex'
          )}>
            {selectedConv ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center gap-3 p-4 border-b border-border">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden h-8 w-8"
                    onClick={() => setSelectedConv(null)}
                  >
                    <Circle className="w-4 h-4" />
                  </Button>
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={selectedConv.other_user_avatar} />
                    <AvatarFallback className="bg-navy/10 text-xs text-navy font-semibold">
                      {getInitials(selectedConv.other_user_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {selectedConv.other_user_name}
                    </p>
                    {selectedConv.subject && (
                      <p className="text-xs text-muted-foreground truncate">{selectedConv.subject}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {selectedConv.message_type === 'product_inquiry'
                      ? (locale === 'ar' ? 'استفسار منتج' : 'Recherche')
                      : (locale === 'ar' ? 'عام' : 'General')}
                  </Badge>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  {messagesLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className={cn('flex gap-2', i % 2 === 0 ? 'justify-start' : 'justify-end')}>
                          <Skeleton className="h-12 w-48 rounded-2xl" />
                        </div>
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <MessageCircle className="w-10 h-10 text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground">
                        {locale === 'ar' ? 'ابدأ المحادثة الآن' : 'Commencez la conversation'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg) => {
                        const isMine = msg.from_user_id === user?.id;
                        return (
                          <div key={msg.id} className={cn('flex gap-2', isMine ? 'justify-end' : 'justify-start')}>
                            {!isMine && (
                              <Avatar className="w-7 h-7 shrink-0 mt-auto">
                                <AvatarImage src={msg.from_avatar_url} />
                                <AvatarFallback className="bg-navy/10 text-[10px] text-navy font-semibold">
                                  {getInitials(msg.from_display_name || 'U')}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div
                              className={cn(
                                'max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                                isMine
                                  ? 'bg-navy text-white rounded-ee-sm'
                                  : 'bg-muted text-foreground rounded-es-sm'
                              )}
                            >
                              <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                              <p className={cn(
                                'text-[10px] mt-1',
                                isMine ? 'text-white/60' : 'text-muted-foreground'
                              )}>
                                {formatRelativeTime(msg.created_at, locale)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                <div className="p-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9">
                      <Paperclip className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={locale === 'ar' ? 'اكتب رسالتك...' : 'Ecrivez votre message...'}
                      className="flex-1 h-9 text-sm"
                      disabled={sending}
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!newMessage.trim() || sending}
                      className="shrink-0 h-9 w-9 p-0 bg-navy hover:bg-navy-light text-white rounded-lg"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              /* Empty state when no conversation selected */
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-5">
                  <MessageCircle className="w-10 h-10 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {locale === 'ar' ? 'اختر محادثة للبدء' : 'Choisissez une conversation'}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
