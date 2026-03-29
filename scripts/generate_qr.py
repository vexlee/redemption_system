"""
QR Code Generator for Redemption System
Generates a QR code for each store pointing to:
  https://YOUR_DOMAIN/redeem?store_id=STORE_ID

Usage:
  pip install qrcode[pil]
  python generate_qr.py

Optionally set env vars:
  SUPABASE_URL, SUPABASE_KEY, DOMAIN
"""

import os
import json
import urllib.request

# ─── Configuration ───────────────────────────────────────────────────────
DOMAIN = os.getenv("DOMAIN", "http://localhost:3000")
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://xpwiluuqerbfxhhcfdtd.supabase.co")
SUPABASE_KEY = os.getenv(
    "SUPABASE_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwd2lsdXVxZXJiZnhoaGNmZHRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NTQ5NDQsImV4cCI6MjA4ODAzMDk0NH0.PnDUT_R8UXH4s_Ktnpxssf7YNyxtakXF9fqPU5W03Hc",
)
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "qr_codes")


def fetch_stores():
    """Fetch all stores from Supabase REST API."""
    url = f"{SUPABASE_URL}/rest/v1/stores?select=id,name,slug&order=name"
    req = urllib.request.Request(
        url,
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
        },
    )
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode())


def generate_qr_codes(stores):
    """Generate a QR code PNG for each store."""
    try:
        import qrcode
    except ImportError:
        print("❌ qrcode library not installed. Run: pip install qrcode[pil]")
        return

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    for store in stores:
        redeem_url = f"{DOMAIN}/redeem?store_id={store['id']}"
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=10,
            border=4,
        )
        qr.add_data(redeem_url)
        qr.make(fit=True)

        img = qr.make_image(fill_color="#1e1b4b", back_color="white")
        filename = f"{store['slug']}.png"
        filepath = os.path.join(OUTPUT_DIR, filename)
        img.save(filepath)
        print(f"✅ {store['name']:.<30} → {filepath}")
        print(f"   URL: {redeem_url}")

    print(f"\n🎉 Generated {len(stores)} QR codes in {OUTPUT_DIR}")


if __name__ == "__main__":
    print("📡 Fetching stores from Supabase...\n")
    stores = fetch_stores()

    if not stores:
        print("⚠️  No stores found.")
    else:
        print(f"Found {len(stores)} store(s):\n")
        for s in stores:
            print(f"  • {s['name']} ({s['slug']})")
        print()
        generate_qr_codes(stores)
