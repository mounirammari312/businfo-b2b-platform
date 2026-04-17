import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bddpxpglnpndgdygdtth.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkZHB4cGdsbnBuZGdkeWdkdHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMDk0ODcsImV4cCI6MjA5MTU4NTQ4N30.VJy330q2P27hpTod5JpdQVcLdfKyL_PTyQ6Qjitg6LE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
