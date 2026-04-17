import { NextRequest, NextResponse } from 'next/server';
import { markNotificationRead } from '@/lib/db';
import { requireAuth } from '@/lib/api/auth';

// PATCH /api/notifications/[id] — Mark notification as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    const { id } = await params;
    const success = await markNotificationRead(id);

    if (!success) {
      return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
