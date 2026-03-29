/**
 * Cookie signing utilities using Web Crypto API.
 * Works in both Edge Runtime (middleware) and Node.js (API routes).
 */

export const COOKIE_NAME = "admin_auth"
const AUTH_VALUE = "authenticated"

/** Returns a signed cookie string: "authenticated.<hmac-hex>" */
export async function signCookieValue(secret: string): Promise<string> {
    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    )
    const sigBuffer = await crypto.subtle.sign(
        "HMAC",
        key,
        new TextEncoder().encode(AUTH_VALUE)
    )
    const hex = Array.from(new Uint8Array(sigBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
    return `${AUTH_VALUE}.${hex}`
}

/** Verifies a signed cookie value. Returns true if valid. */
export async function verifyCookieValue(
    cookieValue: string,
    secret: string
): Promise<boolean> {
    if (!cookieValue?.startsWith(`${AUTH_VALUE}.`)) return false
    const providedHex = cookieValue.slice(AUTH_VALUE.length + 1)

    // SHA-256 HMAC is always 64 hex chars; reject anything else early
    if (providedHex.length !== 64) return false

    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["verify"]
    )

    // Decode provided hex signature back to bytes
    const providedBytes = new Uint8Array(
        providedHex.match(/.{2}/g)!.map((b) => parseInt(b, 16))
    )

    // crypto.subtle.verify performs a guaranteed constant-time comparison
    return crypto.subtle.verify(
        "HMAC",
        key,
        providedBytes,
        new TextEncoder().encode(AUTH_VALUE)
    )
}
