'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getAllMessages } from '@/lib/db';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  MessageCircle, Search, Eye, Mail, Clock, Users, Inbox,
  Package, Award, Megaphone, MessageSquare, ChevronLeft, ChevronRight,
  ArrowRight,
} from 'lucide-react';

interface MessageData {
  id: string;
  conversationId: string;
  fromUserId: string;
  toUserId: string;
  fromDisplayName: string;
  toDisplayName?: string;
  subject?: string;
  body: string;
  isRead: boolean;
  messageType: string;
  createdAt: string;
}

const demoMessages: MessageData[] = [
  { id: '1', conversationId: 'c1', fromUserId: 'u1', toUserId: 'u2', fromDisplayName: 'أحمد بن علي', toDisplayName: 'شركة النور', subject: 'استفسار عن الأسعار', body: 'مرحبا، أود الاستفسار عن أسعار الحواسيب المحمولة المتوفرة لديكم، هل يمكنكم تزويدي بقائمة الأسعار؟', isRead: false, messageType: 'product_inquiry', createdAt: '2025-01-15T10:30:00Z' },
  { id: '2', conversationId: 'c1', fromUserId: 'u2', toUserId: 'u1', fromDisplayName: 'شركة النور', toDisplayName: 'أحمد بن علي', subject: 'رد: استفسار عن الأسعار', body: 'مرحبا أحمد، بالتأكيد سنتواصل معك soon.', isRead: true, messageType: 'product_inquiry', createdAt: '2025-01-15T11:00:00Z' },
  { id: '3', conversationId: 'c2', fromUserId: 'u3', toUserId: 'admin', fromDisplayName: 'مؤسسة البناء', toDisplayName: 'الإدارة', subject: 'طلب شارة مميزة', body: 'نود طلب الحصول على الشارة المميزة الذهبية لشركتنا.', isRead: false, messageType: 'badge_request', createdAt: '2025-01-14T14:20:00Z' },
  { id: '4', conversationId: 'c3', fromUserId: 'u4', toUserId: 'u5', fromDisplayName: 'شركة الأمل', toDisplayName: 'معرض التقنية', subject: 'طلب عرض سعر', body: 'نود طلب عرض سعر لكمية كبيرة من شاشات الكمبيوتر.', isRead: true, messageType: 'product_inquiry', createdAt: '2025-01-14T09:00:00Z' },
  { id: '5', conversationId: 'c4', fromUserId: 'u5', toUserId: 'admin', fromDisplayName: 'معرض التقنية', toDisplayName: 'الإدارة', subject: 'طلب إعلان', body: 'نريد نشر إعلان عن تخفيضاتنا الموسمية.', isRead: false, messageType: 'ad_request', createdAt: '2025-01-13T16:00:00Z' },
  { id: '6', conversationId: 'c5', fromUserId: 'u6', toUserId: 'u2', fromDisplayName: 'محمد الأمين', toDisplayName: 'شركة النور', subject: 'استفسار عام', body: 'مرحبا، هل تقومون بالشحن لجميع ولايات الجزائر؟', isRead: true, messageType: 'general', createdAt: '2025-01-13T11:30:00Z' },
  { id: '7', conversationId: 'c6', fromUserId: 'u7', toUserId: 'u3', fromDisplayName: 'سارة بلقاسم', toDisplayName: 'مؤسسة البناء', subject: 'استفسار عن المنتجات', body: 'هل لديكم أسمنت نوع CPJ 42.5 متوفر حالياً؟', isRead: false, messageType: 'product_inquiry', createdAt: '2025-01-12T10:00:00Z' },
  { id: '8', conversationId: 'c7', fromUserId: 'u8', toUserId: 'admin', fromDisplayName: 'شركة الخليج', toDisplayName: 'الإدارة', subject: 'شكوى', body: 'واجهنا مشكلة في تحديث بيانات متجرنا.', isRead: false, messageType: 'general', createdAt: '2025-01-11T15:00:00Z' },
];

const ITEMS_PER_PAGE = 10;

export default function AdminMessages() {
  const { profile, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [conversationMessages, setConversationMessages] = useState<MessageData[]>([]);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllMessages() as unknown as MessageData[];
      setMessages(data.length > 0 ? data : demoMessages);
    } catch {
      setMessages(demoMessages);
    }
  }, []);

  const isAdmin = !authLoading && profile?.role === 'admin';
  const hasFetched = React.useRef(false);
  React.useEffect(() => {
    if (isAdmin && !hasFetched.current) {
      hasFetched.current = true;
      loadMessages();
    }
  }, [isAdmin, loadMessages]);

  const loading = authLoading;

  // Group messages by conversation
  const conversations = messages.reduce((acc, msg) => {
    const key = msg.conversationId;
    if (!acc[key]) {
      acc[key] = {
        id: key,
        participants: [msg.fromDisplayName, msg.toDisplayName || ''].filter(Boolean).join(' - '),
        lastMessage: msg,
        messageCount: 0,
        unreadCount: 0,
        type: msg.messageType,
      };
    }
    acc[key].messageCount++;
    if (!msg.isRead) acc[key].unreadCount++;
    if (new Date(msg.createdAt) > new Date(acc[key].lastMessage.createdAt)) {
      acc[key].lastMessage = msg;
    }
    return acc;
  }, {} as Record<string, { id: string; participants: string; lastMessage: MessageData; messageCount: number; unreadCount: number; type: string }>);

  const conversationList = Object.values(conversations);

  const filteredConversations = conversationList.filter((c) => {
    const matchSearch = c.participants.includes(search) ||
      c.lastMessage.subject?.includes(search) ||
      c.lastMessage.body.includes(search);
    const matchType = typeFilter === 'all' || c.type === typeFilter;
    return matchSearch && matchType;
  });

  const totalPages = Math.ceil(filteredConversations.length / ITEMS_PER_PAGE);
  const paginated = filteredConversations.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const openConversation = (conversationId: string) => {
    setSelectedConversation(conversationId);
    const msgs = messages.filter(m => m.conversationId === conversationId);
    setConversationMessages(msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'product_inquiry': return <Package className="w-3.5 h-3.5 text-blue-500" />;
      case 'badge_request': return <Award className="w-3.5 h-3.5 text-yellow-500" />;
      case 'ad_request': return <Megaphone className="w-3.5 h-3.5 text-purple-500" />;
      default: return <MessageSquare className="w-3.5 h-3.5 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'product_inquiry': return <Badge className="bg-blue-100 text-blue-700 text-[11px]">استفسار منتج</Badge>;
      case 'badge_request': return <Badge className="bg-yellow-100 text-yellow-700 text-[11px]">طلب شارة</Badge>;
      case 'ad_request': return <Badge className="bg-purple-100 text-purple-700 text-[11px]">طلب إعلان</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-600 text-[11px]">عام</Badge>;
    }
  };

  const totalConversations = conversationList.length;
  const totalUnread = conversationList.reduce((sum, c) => sum + c.unreadCount, 0);

  if (authLoading || loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Card><CardContent className="p-0">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full border-b" />)}</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-[#1B3A5C]" />
          المراسلات
        </h1>
        <p className="text-sm text-gray-500">مراقبة المحادثات بين المستخدمين (للقراءة فقط)</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{totalConversations}</p>
              <p className="text-xs text-gray-500">إجمالي المحادثات</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <Inbox className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{totalUnread}</p>
              <p className="text-xs text-gray-500">رسائل غير مقروءة</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="بحث في المحادثات..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pr-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="نوع المحادثة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="product_inquiry">استفسار منتج</SelectItem>
                <SelectItem value="badge_request">طلب شارة</SelectItem>
                <SelectItem value="ad_request">طلب إعلان</SelectItem>
                <SelectItem value="general">عام</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Conversations List */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {paginated.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">لا يوجد محادثات</p>
              </div>
            ) : (
              paginated.map((conv) => (
                <div
                  key={conv.id}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => openConversation(conv.id)}
                >
                  <div className="w-10 h-10 rounded-full bg-[#1B3A5C]/10 flex items-center justify-center shrink-0">
                    {getTypeIcon(conv.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-gray-900 truncate">{conv.participants}</p>
                      {conv.unreadCount > 0 && (
                        <span className="bg-[#1B3A5C] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{conv.lastMessage.subject || conv.lastMessage.body}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getTypeLabel(conv.type)}
                      <span className="text-[11px] text-gray-400">{formatRelativeTime(conv.lastMessage.createdAt)}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            عرض {(page - 1) * ITEMS_PER_PAGE + 1} إلى {Math.min(page * ITEMS_PER_PAGE, filteredConversations.length)} من {filteredConversations.length}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
              <Button key={i + 1} variant={page === i + 1 ? 'default' : 'outline'} size="sm" className="w-8 h-8 p-0" onClick={() => setPage(i + 1)}>
                {i + 1}
              </Button>
            ))}
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Conversation Detail Dialog */}
      <Dialog open={!!selectedConversation} onOpenChange={() => setSelectedConversation(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-[#1B3A5C]" />
              تفاصيل المحادثة
            </DialogTitle>
            <DialogDescription>
              {conversationMessages[0]?.subject || 'محادثة'}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-3 py-2">
              {conversationMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.fromUserId === 'admin' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                    msg.fromUserId === 'admin' ? 'bg-[#1B3A5C]' : 'bg-gray-400'
                  }`}>
                    {msg.fromDisplayName.charAt(0)}
                  </div>
                  <div className={`max-w-[75%] rounded-lg p-3 ${
                    msg.fromUserId === 'admin' ? 'bg-[#1B3A5C] text-white' : 'bg-gray-100'
                  }`}>
                    <p className="text-xs font-medium mb-1 opacity-70">{msg.fromDisplayName}</p>
                    <p className="text-sm leading-relaxed">{msg.body}</p>
                    <p className={`text-[10px] mt-1 opacity-50`}>{formatRelativeTime(msg.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="mt-2 pt-3 border-t border-gray-200">
            <p className="text-xs text-center text-gray-400">
              وضع القراءة فقط - لا يمكن للمسؤول المشاركة في المحادثات
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
