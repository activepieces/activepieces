#!/usr/bin/env python3
"""
Interactive OAuth credential collector for Synkra Flow.

Prompts for each credential, hidden input, writes to .env atomically.
Values never appear in shell history, logs, or chat.

Run: python3 /root/synkra-flow/scripts/collect-oauth-keys.py
"""
import getpass
import os
import sys
from pathlib import Path

ENV_FILE = Path("/root/synkra-flow/.env")
CALLBACK_URL = "https://flow.synkra.co.za/api/v1/app-connections/oauth2/callback"

# Each provider maps to the piece it belongs to.
# Env var naming: OAUTH_<PROVIDER>_<FIELD>
PROVIDERS = [
    {
        "env_prefix": "OAUTH_SLACK",
        "display": "Slack",
        "console": "https://api.slack.com/apps",
        "hint": "Create an app, add OAuth scopes, and paste the callback URL above.",
        "fields": [
            ("CLIENT_ID", "Client ID"),
            ("CLIENT_SECRET", "Client Secret"),
            ("SIGNING_SECRET", "Signing Secret"),
            ("VERIFICATION_TOKEN", "Verification Token (Basic Information → App Credentials)"),
        ],
    },
    {
        "env_prefix": "OAUTH_SHOPIFY",
        "display": "Shopify",
        "console": "https://partners.shopify.com",
        "hint": "Create a new app, set the callback URL, copy the Client ID and Secret.",
        "fields": [
            ("CLIENT_ID", "Client ID (API Key)"),
            ("CLIENT_SECRET", "Client Secret (API Secret Key)"),
        ],
    },
    {
        "env_prefix": "OAUTH_ZOHO_CRM",
        "display": "Zoho CRM",
        "console": "https://api-console.zoho.com",
        "hint": "Create a Server-based Application. Use the callback URL above.",
        "fields": [
            ("CLIENT_ID", "Client ID"),
            ("CLIENT_SECRET", "Client Secret"),
        ],
    },
    {
        "env_prefix": "OAUTH_ZOHO_BOOKS",
        "display": "Zoho Books",
        "console": "https://api-console.zoho.com",
        "hint": "Same Zoho console. You can reuse the same OAuth app if you added the Books scope — paste the same values, or create a separate app.",
        "fields": [
            ("CLIENT_ID", "Client ID"),
            ("CLIENT_SECRET", "Client Secret"),
        ],
    },
    {
        "env_prefix": "OAUTH_PIPEDRIVE",
        "display": "Pipedrive",
        "console": "https://pipedrive.com/developer",
        "hint": "Create a new app, set the callback URL, copy Client ID and Secret.",
        "fields": [
            ("CLIENT_ID", "Client ID"),
            ("CLIENT_SECRET", "Client Secret"),
        ],
    },
    {
        "env_prefix": "OAUTH_CLICKUP",
        "display": "ClickUp",
        "console": "https://clickup.com/developers",
        "hint": "Create an app, set the redirect URL, copy Client ID and Secret.",
        "fields": [
            ("CLIENT_ID", "Client ID"),
            ("CLIENT_SECRET", "Client Secret"),
        ],
    },
]


def read_env():
    """Return the current .env as a dict of key -> raw line (to preserve formatting)."""
    if not ENV_FILE.exists():
        return {}
    lines = {}
    for line in ENV_FILE.read_text().splitlines():
        if line.strip() == "" or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        k = line.split("=", 1)[0].strip()
        lines[k] = line
    return lines


def upsert_env(key, value):
    """Insert or replace a key in .env, preserving other lines."""
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


def prompt_value(label, hidden=True):
    """Prompt for a value. Returns stripped string or None for skip."""
    try:
        print(f"    {label}")
        if hidden:
            v = getpass.getpass("      → ")
        else:
            v = input("      → ").strip()
    except (EOFError, KeyboardInterrupt):
        print("\n\n  Aborted. Nothing saved for this provider.\n")
        return None
    return v


def main():
    env = read_env()

    print("=" * 70)
    print(" Synkra Flow — OAuth Credential Collector")
    print("=" * 70)
    print()
    print(" Paste values when prompted. Input is hidden and never stored")
    print(" in shell history.")
    print()
    print(" Callback URL to register at EVERY provider:")
    print(f"   {CALLBACK_URL}")
    print()
    print(" Press Enter to skip a field. Ctrl+C to abort current provider.")
    print()

    try:
        input(" Press Enter to begin...")
    except EOFError:
        pass
    print()

    summary = []

    for provider in PROVIDERS:
        print("─" * 70)
        print(f"  {provider['display']}")
        print(f"  Console: {provider['console']}")
        print(f"  {provider['hint']}")
        print()

        collected = {}
        skipped_provider = False

        for field_key, field_label in provider["fields"]:
            env_key = f"{provider['env_prefix']}_{field_key}"
            existing = env.get(env_key)
            if existing:
                print(f"    {field_label} [already set — Enter to keep, 'x' to clear]")
            val = prompt_value(field_label, hidden=True)

            if val is None:
                skipped_provider = True
                break
            if val == "":
                if existing:
                    collected[env_key] = existing.split("=", 1)[1]
                    print(f"      (kept existing)")
                else:
                    print(f"      (skipped)")
                continue
            if val == "x":
                collected[env_key] = None
                print(f"      (cleared)")
                continue

            collected[env_key] = val
            print(f"      ✓ set")

        if skipped_provider:
            print()
            continue

        for k, v in collected.items():
            if v is None:
                continue
            upsert_env(k, v)

        set_count = sum(1 for v in collected.values() if v)
        total = len(provider["fields"])
        status = "✓ complete" if set_count == total else f"partial ({set_count}/{total})"
        summary.append((provider["display"], status))
        print(f"\n  → {status}\n")

    print("=" * 70)
    print(" SUMMARY")
    print("=" * 70)
    for name, status in summary:
        print(f"   {status:<25} {name}")
    print()
    print(f" Saved to: {ENV_FILE}")
    print(f" Next: run the auto-register command to wire these into Synkra Flow.")
    print()


if __name__ == "__main__":
    main()
