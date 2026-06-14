import { createBrowserClient } from '@supabase/ssr'

// Cliente singleton para componentes del navegador ('use client')
export function createSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
