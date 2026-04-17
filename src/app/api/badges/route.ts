import { NextResponse } from 'next/server';
import { getBadgeTypes } from '@/lib/db';

// GET /api/badges — List available badge types
export async function GET() {
  try {
    const badgeTypes = await getBadgeTypes();
    return NextResponse.json({ badgeTypes });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
