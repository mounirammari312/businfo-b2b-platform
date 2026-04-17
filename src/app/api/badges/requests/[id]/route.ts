import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { approveBadgeRequest, rejectBadgeRequest } from '@/lib/db';
import { requireRole } from '@/lib/api/auth';

const approveSchema = z.object({
  action: z.literal('approve'),
  expiresAt: z.string().optional(),
});

const rejectSchema = z.object({
  action: z.literal('reject'),
  reason: z.string().optional(),
});

// PATCH /api/badges/requests/[id] — Approve or reject badge request
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(request, ['admin']);
    if (auth.response) return auth.response;

    const { id } = await params;
    const body = await request.json();

    const approveParse = approveSchema.safeParse(body);
    const rejectParse = rejectSchema.safeParse(body);

    if (approveParse.success) {
      const result = await approveBadgeRequest(id, approveParse.data.expiresAt);
      if (!result) {
        return NextResponse.json({ error: 'Failed to approve badge request' }, { status: 500 });
      }
      return NextResponse.json({ badgeRequest: result });
    }

    if (rejectParse.success) {
      const result = await rejectBadgeRequest(id, rejectParse.data.reason);
      if (!result) {
        return NextResponse.json({ error: 'Failed to reject badge request' }, { status: 500 });
      }
      return NextResponse.json({ badgeRequest: result });
    }

    return NextResponse.json(
      { error: 'Invalid action. Must be "approve" or "reject"', details: 'Expected { action: "approve" | "reject" }' },
      { status: 400 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
