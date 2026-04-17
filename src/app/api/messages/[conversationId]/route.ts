import { NextRequest, NextResponse } from 'next/server';
import { getMessages, markAsRead } from '@/lib/db';
import { requireAuth } from '@/lib/api/auth';

// GET /api/messages/[conversationId] — Get messages in a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    const { conversationId } = await params;
    const messages = await getMessages(conversationId);

    return NextResponse.json({ messages });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/messages/[conversationId] — Mark all messages as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    const { conversationId } = await params;

    // Get messages and mark unread ones as read
    const messages = await getMessages(conversationId);
    const unreadMessages = messages.filter(m => !m.isRead && m.toUserId === auth.user.id);

    await Promise.all(unreadMessages.map(m => markAsRead(m.id)));

    return NextResponse.json({ success: true, markedRead: unreadMessages.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
