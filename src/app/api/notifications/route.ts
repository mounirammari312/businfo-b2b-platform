import { NextResponse } from 'next/server';
import { getNotifications } from '@/lib/db';
import { requireAuth } from '@/lib/api/auth';

// GET /api/notifications — List user notifications
export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request as unknown as import('next/server').NextRequest);
    if (auth.response) return auth.response;

    const notifications = await getNotifications(auth.user.id);
    return NextResponse.json({ notifications });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
