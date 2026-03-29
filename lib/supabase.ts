import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Export the client. If URL/Key is missing (e.g. during build-time prerendering on Vercel),
// createClient would throw. We check for their existence to avoid a build-time crash.
export const supabase = (supabaseUrl && supabaseAnonKey) 
    ? createClient(supabaseUrl, supabaseAnonKey) 
    : (null as any) // If null, the app will warn/error at runtime when used, but build can finish.
