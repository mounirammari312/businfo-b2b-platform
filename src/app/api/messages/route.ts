import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { getConversations, sendMessage, getUnreadCount } from '@/lib/db';
import { requireAuth } from '@/lib/api/auth';

const messageSchema = z.object({
  toUserId: z.string().min(1, 'Recipient ID is required'),
  subject: z.string().optional(),
  body: z.string().min(1, 'Message body is required'),
  conversationId: z.string().optional(),
  messageType: z.enum(['product_inquiry', 'badge_request', 'ad_request', 'general']).optional(),
  relatedId: z.string().optional(),
});

// GET /api/messages — List conversations or get unread count
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);

    // Unread count
    if (searchParams.get('unread') === 'true') {
      const count = await getUnreadCount(auth.user.id);
      return NextResponse.json({ count });
    }

    // Conversations list
    const conversations = await getConversations(auth.user.id);
    return NextResponse.json({ conversations });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/messages — Send a message
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    const body = await request.json();
    const parsed = messageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 });
    }

    const msg = await sendMessage({
      fromUserId: auth.user.id,
      fromDisplayName: auth.user.profile?.displayName || '',
      ...parsed.data,
    });

    if (!msg) {
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    return NextResponse.json({ message: msg }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
