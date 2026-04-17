import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase as anonClient } from '@/lib/supabase';
import type { UserProfile } from '@/lib/types';

/**
 * Get the authenticated user from the request.
 * Supports both Authorization header and cookie-based auth.
 */
export async function getAuthUser(request: NextRequest) {
  try {
    // Try to get token from Authorization header first
    const authHeader = request.headers.get('Authorization');
    let accessToken = authHeader?.replace('Bearer ', '');

    // If no token in header, try to get from cookies
    if (!accessToken) {
      const cookieToken = request.cookies.get('sb-bddpxpglnpndgdygdtth-auth-token');
      if (cookieToken?.value) {
        try {
          const parsed = JSON.parse(cookieToken.value);
          accessToken = parsed.access_token;
        } catch {
          // ignore parse errors
        }
      }
    }

    if (!accessToken) {
      return null;
    }

    // Create a supabase client with the user's token
    const supabaseWithToken = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bddpxpglnpndgdygdtth.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
      }
    );

    const { data: { user }, error } = await supabaseWithToken.auth.getUser();
    if (error || !user) return null;

    // Get the user's profile
    const { data: profile } = await anonClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email,
      profile: profile as UserProfile | null,
    };
  } catch {
    return null;
  }
}

/**
 * Require authentication — returns user or sends 401 response.
 */
export async function requireAuth(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    };
  }
  return { user, response: null };
}

/**
 * Require a specific role — returns user or sends 403 response.
 */
export async function requireRole(request: NextRequest, roles: string[]) {
  const auth = await requireAuth(request);
  if (auth.response) return auth;

  const userRole = auth.user.profile?.role;
  if (!userRole || !roles.includes(userRole)) {
    return {
      user: auth.user,
      response: NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 }),
    };
  }

  return { user: auth.user, response: null };
}

/**
 * Parse and validate JSON body from request.
 */
export async function parseBody<T>(request: NextRequest): Promise<T> {
  return request.json() as Promise<T>;
}
