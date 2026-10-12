# Synkra Flow — Feature Inventory
# 12 October 2026

Honest categorization. Three tiers:
  A. CONFIRMED WORKING — we have seen it work in a browser
  B. DEPLOYED, UNTESTED — code is in the running build, not verified
  C. NOT DEPLOYED — code may exist in git but is not running

If it's not in tier A, do not tell anyone it works.

---

## TIER A — CONFIRMED WORKING

These were verified in a real browser on 12 Oct 2026.

### Core app
- App loads at https://flow.synkra.co.za (no white screen)
- Login with email + password
- Dashboard renders after login
- Sidebar navigation
- User menu (avatar dropdown)

### Account
- Sign up
- Log in
- Log out
- Password reset flow (AP native)
- Session management (AP native)

---

## TIER B — DEPLOYED, UNTESTED

All of this code is IN the current build (commit 40d2cfff).
None of it has been verified in a browser since deployment.
Treat every line below as "probably works but unconfirmed."

### Onboarding (added this session, never tested in browser)
- Welcome screen at /onboarding
- Use case selection (7 options)
- Start point selection (scratch / template / explore)
- Connect tools step (recommended integrations)
- Build workflow step (opens builder)
- Redirect logic: new users go to /onboarding, existing users skip
- Persistence: synkra_onboarding table tracks step, use case, skipped, completed

### Builder nudge (new, never tested)
- Dismissable tip inside the flow builder
- Detects state: needs_trigger / needs_action / ready_to_test / success
- Per-flow dismissal persisted to localStorage
- Success shows "Back to dashboard" link

### Get Started checklist (new, never tested)
- Appears on /automations empty state
- 4 items: create workflow, connect integration, explore catalogue, run test
- Progress bar
- Manual check-off
- X to dismiss (persisted to localStorage)

### Billing core (built earlier, untested end to end)
- /billing page with usage bars
- Upgrade button → /billing/checkout
- Downgrade button (schedules for period end)
- Cancel button (schedules for period end)
- Reactivate button (undo scheduled cancel/downgrade)
- Scheduled-change banner on /billing
- /billing/checkout page with 3 tiers (Starter / Business / Pro)
- Cancel / downgrade / reactivate endpoints:
    POST /v1/synkra/subscription/cancel
    POST /v1/synkra/subscription/reactivate
    POST /v1/synkra/subscription/downgrade
- Renewals job runs hourly:
    - 3-day-before renewal reminder email
    - Renewals extend period by 30 days
    - Scheduled downgrades applied
    - Scheduled cancels applied (→ Free)
- 8 transactional emails via nodemailer / Resend:
    sendWelcomeUpgrade
    sendDowngradeScheduled
    sendCancelScheduled
    sendRenewalReminder
    sendRenewalSuccess
    sendRenewalFailed
    sendAccountRestricted
    sendAccountRestored

### AI credits (built earlier, untested in browser)
- Chat with AI visible in sidebar
- Agents visible in sidebar
- AI credits meter increments aiOpsUsed
  (1 credit = 1,000 tokens, rounded up)
- AI guard blocks chat + agents when credits exhausted
- /v1/synkra/ai/balance returns { used, limit, remaining, exhausted }
- AI credits pill component exists in chat header (untested visually)
- Billing page shows "AI credits" instead of "AI operations"

### BYOK lockdown (untested)
- Only Pro can add own AI provider
- Free / Starter / Business are blocked
- Enforced in ai-provider-controller.ts

### Metering enforcement (untested)
- API keys: Free/Starter blocked, Business max 10, Pro max 25
- Custom roles: Free/Starter blocked
- SSO: Free/Starter blocked
- Audit logs: Free/Starter blocked
- White label: Agency Programme only (no standard tier)

### OAuth (built earlier, partially tested)
- 16 OAuth providers seeded on boot:
    Slack, Shopify, Zoho CRM, Zoho Books, Pipedrive, ClickUp,
    GitHub, GitLab, Mailchimp, Square,
    Gmail, Google Drive, Google Sheets, Google Docs,
    Google Calendar, Google Forms
- OAuth seeder logs "seeded": 16, "missing": 0, "failed": 0

### Custom pieces (built earlier, installed on boot)
- Synkra Chat (13 actions, 3 triggers) — confirmed working in earlier sessions
- PayFast (3 actions + ITN trigger)
- Yoco (3 actions + webhook)
- iKhokha (3 actions + webhook)
- The Courier Guy (3 actions + webhook)
- Bob Go (3 actions + webhook)
- Uber Direct (3 actions + webhook)
- Pargo (3 actions + webhook)
Yoco and iKhokha needed a version bump to 0.1.1 to bypass engine cache.

### Visible catalogue
- 80 pieces visible in the picker (was 69, expanded by more)
  See docs/synkra/FLOW-PRICING-FEATURES.md for full list

### Agency Programme (built this session, NEVER tested)
- /agency dashboard renders (claimed, unverified)
- Draft agency state on first visit
- Rename agency
- Tier switcher: Agency 20 (R699), Agency 100 (R1,499), Agency 500 (R2,999)
- Activate agency
- Suspend agency
- Branding card: logo URL, colour, support email, welcome message
- Client environments:
    - List clients
    - Create client (creates isolated Flow project)
    - Activate client
    - Suspend client
    - Handover (transfer out)
- Client environment isolation: uses Flow's native project system
- Wholesale pricing: 35% off (Agency 20) / 40% off (Agency 100/500)
- Billing summary endpoint shows agency fee + active client wholesale total

### Agency portal (built this session, NEVER tested)
- Token-based, no login required
- URL format: /portal/{256-bit-token}
- Public endpoint: GET /v1/synkra/agency/public/{token}
- Shows: agency name, logo, welcome message, package tier, 3 usage tiles
- Support email as mailto link
- Enable/disable from agency dashboard

### Agency invoices (built this session, NEVER tested)
- Invoice entity + service + controller
- Generate invoice manually via "Generate now" button
- Invoice list with status pills
- Invoice detail dialog with line items
- Paystack payment link creation
- PDF generator using pdfkit:
    - Synkra-branded invoice with green accents
    - Line items table
    - Payment link clickable
    - 7-day grace notice in footer
- Agency billing cron (hourly):
    - Generates invoices for active agencies
    - Sends daily reminders while pending
    - Enforces overdue after 7 days: suspends agency + all clients
- Paystack agency webhook at /v1/synkra/paystack/agency-webhook:
    - Signature verification
    - Marks invoice paid
    - Unsuspends agency + clients
    - Sends restoration email

### Shadow user safety (built this session, NEVER tested)
- user.shadowChatUserId column added to DB (indexed)
- checkSeatLimit excludes shadow users
- Email guard blocks @shadow.synkra.internal domain
- No shadow users created yet — this is preparation for Chat integration

### Security
- Session management (AP native)
- Password hashing (bcrypt)
- Tenant data isolation (AP native)
- Credential encryption (AP native, encryptUtils)
- Audit logs, SSO, API keys flags flipped to enabled

### Utility
- Dark mode / light mode / system toggle
- Glossary page at /glossary
- Health endpoint at /api/v1/synkra/health
- Preflight page at /platform/preflight (owner only)

---

## TIER C — CODE EXISTS BUT NOT DEPLOYED

Not in the current running build.

### Chat ↔ Flow integration
- Spec locked (shadow user, HMAC API, launch order, attribution)
- Zero code written yet

### Add-on packs purchase flow
- Packs defined in pricing doc
- No purchase UI, no Paystack one-time checkout
- No credit rollover / FIFO consumption

### SA pieces (candidates, none built)
- Takealot, SnapScan, Ozow, Peach Payments, PayGate, Netcash,
  BulkSMS, Clickatell, Telnyx, Drop, Sage Accounting, CIPC
- Each is 1-2 batches to build

### Developer Marketplace
- Not started

### Institutional / Volume pricing
- Not started

### Student / Community programmes
- Doc mentions R149/R249 student pricing, 60% community discount
- No verification flow, no application flow, no eligibility tracking

### S3 backups
- Script exists but rclone + boto3 both hang on Z1 S3
- Cron entry exists but script fails silently
- No automated database backup

### Integration Addendum / Developer Addendum / Agency Addendum
- Referenced in legal spec
- Not written

---

## WHAT'S NOT BUILT AT ALL

Just so there's no confusion:

- Custom domain (doesn't exist as a feature, only in pricing doc)
- Pre-built recipe gallery (20 substantial templates mentioned in plan)
- Self-serve agency application
- Email verification flow
- 2FA enforcement
- Rate limiting on signup
- Log aggregation
- Uptime monitoring
- Any migration tool

---

## HOW TO UPDATE THIS DOCUMENT

When you test a feature and it works:
    Move it from Tier B to Tier A. Add the date.

When you test a feature and it fails:
    Add a "KNOWN BROKEN" subsection under Tier B with the error message.

When you build something new:
    Add it to Tier C or Tier B (never Tier A until tested).

Rule: nothing goes in Tier A without a browser-verified session.

---

END OF INVENTORY.
