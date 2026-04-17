import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { approveAdRequest, rejectAdRequest } from '@/lib/db';
import { requireRole } from '@/lib/api/auth';

const approveSchema = z.object({
  action: z.literal('approve'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
});

const rejectSchema = z.object({
  action: z.literal('reject'),
  reason: z.string().optional(),
});

// PATCH /api/ads/requests/[id] — Approve or reject ad request
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
      const result = await approveAdRequest(id, approveParse.data.startDate, approveParse.data.endDate);
      if (!result) {
        return NextResponse.json({ error: 'Failed to approve ad request' }, { status: 500 });
      }
      return NextResponse.json({ adRequest: result });
    }

    if (rejectParse.success) {
      const result = await rejectAdRequest(id, rejectParse.data.reason);
      if (!result) {
        return NextResponse.json({ error: 'Failed to reject ad request' }, { status: 500 });
      }
      return NextResponse.json({ adRequest: result });
    }

    return NextResponse.json(
      { error: 'Invalid action. Must be "approve" or "reject"' },
      { status: 400 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
