import { createClient } from "@supabase/supabase-js"

/**
 * Creates a Supabase client using the service role key.
 * Bypasses Row Level Security — use only in server-side API routes.
 * Never expose this client or the service key to the browser.
 */
export function createServiceClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!serviceKey) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set")
    }

    return createClient(url, serviceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
}
