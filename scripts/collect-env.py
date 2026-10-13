#!/usr/bin/env python3
"""
Interactive env var collector. Hidden input. Writes to .env atomically.
Preserves existing values. Press Enter to keep an existing value.
"""
import getpass, os
from pathlib import Path

ENV_FILE = Path("/root/synkra-flow/.env")

VARS = [
    # (env_key, prompt label, is_secret, description)
    ("SYNKRA_PAYSTACK_SECRET_KEY",      "Paystack Secret Key",      True,  "sk_live_xxx or sk_test_xxx"),
    ("SYNKRA_PAYSTACK_PUBLIC_KEY",      "Paystack Public Key",      False, "pk_live_xxx or pk_test_xxx"),
    ("SYNKRA_PAYSTACK_WEBHOOK_SECRET",  "Paystack Webhook Secret",  True,  "whsec_xxx"),
    ("SYNKRA_PAYSTACK_PLAN_STARTER",    "Paystack Starter Plan Code",    False, "PLN_15wpi28chj8eg2e"),
    ("SYNKRA_PAYSTACK_PLAN_BUSINESS",   "Paystack Business Plan Code",   False, "PLN_rkob6fqorz4mdxw"),
    ("SYNKRA_PAYSTACK_PLAN_PRO",        "Paystack Pro Plan Code",        False, "PLN_u2eholu8jg435he"),
    ("RESEND_API_KEY",                  "Resend API Key",           True,  "re_xxx"),
    ("RESEND_FROM_EMAIL",               "Resend From Email",        False, "noreply@synkra.co.za"),
    ("RESEND_FROM_NAME",                "Resend From Name",         False, "Synkra Flow"),
    ("SYNKRA_AI_API_KEY",               "Synkra AI API Key (DeepSeek)", True,  "sk-xxx"),
    ("SYNKRA_AI_BASE_URL",              "Synkra AI Base URL",       False, "https://api.deepseek.com/v1"),
    ("SYNKRA_AI_MODEL",                 "Synkra AI Model",          False, "deepseek-chat"),
]

def read_existing(key):
    if not ENV_FILE.exists():
        return None
    for line in ENV_FILE.read_text().splitlines():
        if line.startswith(f"{key}="):
            return line.split("=", 1)[1]
    return None

def upsert(key, value):
    text = ENV_FILE.read_text() if ENV_FILE.exists() else ""
    lines = text.splitlines()
    new_line = f"{key}={value}"
    found = False
    for i, line in enumerate(lines):
        if line.startswith(f"{key}="):
            lines[i] = new_line
            found = True
            break
    if not found:
        if lines and lines[-1].strip() != "":
            lines.append("")
        lines.append(new_line)
    ENV_FILE.write_text("\n".join(lines) + "\n")
    os.chmod(ENV_FILE, 0o600)

print("=" * 70)
print(" Synkra Flow — Environment Variables Collector")
print("=" * 70)
print()
print(" Instructions:")
print("   - Press Enter to keep an existing value")
print("   - Type 'x' to clear an existing value")
print("   - Ctrl+C to abort (nothing is saved)")
print()
try:
    input(" Press Enter to begin...")
except EOFError:
    pass
print()

for key, label, is_secret, hint in VARS:
    existing = read_existing(key)
    if existing:
        print(f"── {label} [already set]")
    else:
        print(f"── {label}")
    print(f"   hint: {hint}")

    try:
        if is_secret:
            val = getpass.getpass("   → ")
        else:
            val = input("   → ").strip()
    except (EOFError, KeyboardInterrupt):
        print("\n   (aborted — nothing saved for this value)")
        continue

    if val == "" and existing:
        print("   (kept existing)")
    elif val == "":
        print("   (skipped)")
    elif val == "x":
        upsert(key, "")
        print("   (cleared)")
    else:
        upsert(key, val)
        print("   ✓ set")
    print()

print("=" * 70)
print(" Done.")
print(f" .env updated at: {ENV_FILE}")
print("=" * 70)
print()
print(" Next:")
print("   docker restart synkra-flow-app synkra-flow-worker")
print("   sleep 30")
print("   curl -sS http://localhost:8199/api/v1/synkra/health")
