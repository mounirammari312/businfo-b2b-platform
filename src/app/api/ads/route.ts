import { NextResponse } from 'next/server';
import { getAdTypes } from '@/lib/db';

// GET /api/ads — List available ad types
export async function GET() {
  try {
    const adTypes = await getAdTypes();
    return NextResponse.json({ adTypes });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
