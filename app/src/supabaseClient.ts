import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!url || !key) {
  // In dev/build, we rely on .env files or Vercel env vars. For safety, keep a clear error in console.
  // Do not throw at module scope to avoid breaking SSR/build tools.
  console.warn('Supabase not configured: missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY');
}

export const supabase = createClient(url ?? '', key ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export default supabase;
