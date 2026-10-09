#!/usr/bin/env python3
"""Interactive collector for the second batch of OAuth providers."""
import getpass, os
from pathlib import Path

ENV_FILE = Path("/root/synkra-flow/.env")

PROVIDERS = [
    {
        "env_prefix": "OAUTH_GITHUB",
        "display": "GitHub",
        "fields": [("CLIENT_ID", "Client ID"), ("CLIENT_SECRET", "Client Secret")],
    },
    {
        "env_prefix": "OAUTH_GITLAB",
        "display": "GitLab",
        "fields": [("CLIENT_ID", "Application ID"), ("CLIENT_SECRET", "Secret")],
    },
    {
        "env_prefix": "OAUTH_MAILCHIMP",
        "display": "Mailchimp",
        "fields": [("CLIENT_ID", "Client ID"), ("CLIENT_SECRET", "Client Secret")],
    },
    {
        "env_prefix": "OAUTH_SQUARE",
        "display": "Square",
        "fields": [("CLIENT_ID", "Application ID"), ("CLIENT_SECRET", "Application Secret")],
    },
]

def upsert_env(key, value):
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

def read_existing(key):
    if not ENV_FILE.exists():
        return None
    for line in ENV_FILE.read_text().splitlines():
        if line.startswith(f"{key}="):
            return line.split("=", 1)[1]
    return None

print("=" * 60)
print(" Second batch — OAuth credentials")
print("=" * 60)
print()
try:
    input(" Press Enter to begin...")
except EOFError:
    pass
print()

summary = []
for prov in PROVIDERS:
    print(f"── {prov['display']} ──")
    for field_key, field_label in prov["fields"]:
        env_key = f"{prov['env_prefix']}_{field_key}"
        existing = read_existing(env_key)
        if existing:
            print(f"   {field_label} [already set — Enter to keep]")
        try:
            val = getpass.getpass(f"   {field_label}: ")
        except (EOFError, KeyboardInterrupt):
            print("   (aborted, skipping provider)")
            break
        if val == "" and existing:
            print("   (kept existing)")
        elif val == "":
            print("   (skipped)")
        else:
            upsert_env(env_key, val)
            print("   ✓ set")
    print()
    summary.append(prov["display"])

print("=" * 60)
print(" Saved:", ", ".join(summary))
print("=" * 60)
