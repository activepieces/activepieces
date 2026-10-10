# Synkra Flow — Billing

**Last updated:** 10 October 2026

---

## What this document is

The strategic billing reference. For step-by-step upgrade/downgrade/cancel
flows, see `BILLING-FLOWS.md`. This doc covers plans, pricing, payment
processing, and email notifications.

---

## 1. Plans

Source of truth: `packages/core/shared/src/lib/synkra/plans.ts`

| Tier | ZAR/mo | Seats | Workspaces | Executions | Active workflows | AI credits | Storage |
|------|-------:|------:|-----------:|-----------:|-----------------:|-----------:|--------:|
| Free | 0 | 1 | 1 | 500 | 5 | 0 | 1 GB |
| Starter | 299 | 3 | 1 | 15,000 | 25 | 1,000 | 10 GB |
| Business | 599 | 10 | 3 | 50,000 | 100 | 5,000 | 50 GB |
| Pro | 999 | 25 | 10 | 150,000 | 500 | 20,000 | 200 GB |

### Feature gates

| Feature | Free | Starter | Business | Pro |
|---------|:----:|:-------:|:--------:|:---:|
| Integrations | ✅ | ✅ | ✅ | ✅ |
| SSO | ❌ | ❌ | ✅ | ✅ |
| API keys | ❌ | ❌ | ✅ | ✅ |
| Custom domain | ❌ | ❌ | ✅ | ✅ |
| Audit logs | ❌ | ❌ | ✅ | ✅ |
| White label | ❌ | ❌ | ❌ | ✅ |
| Bring your own AI key | ❌ | ❌ | ❌ | ✅ |

---

## 2. AI credits

**Unit:** 1 credit = 1,000 tokens (input + output, rounded up).

Applies to every AI operation:
- Chat with AI
- Agent runs
- AI piece steps (OpenAI, Claude, Gemini, Groq, DeepSeek, Perplexity)
- Image generation (fixed 20 credits per image)
- Audio transcription (fixed 10 credits per minute)
- Embeddings (1 credit per 1,000 tokens)

**Free plan has 0 credits.** Users on Free cannot use any AI feature. The
AI guard throws `QUOTA_EXCEEDED` before the AI call runs.

**BYOK lockdown:** Only Pro can bring their own AI key. Free/Starter/Business
must use Synkra AI (our DeepSeek-backed provider).

**Enforcement:** `packages/server/api/src/app/synkra/ai/synkra-ai-guard.ts`
Called pre-flight from:
- `agent-conversation-controller.ts` (chat)
- `agent-run-controller.ts` (agents)

---

## 3. Payment processing

**Provider:** Paystack (South Africa)

**Required env vars:**

SYNKRA_PAYSTACK_SECRET_KEY=sk_live_xxx
SYNKRA_PAYSTACK_WEBHOOK_SECRET=whsec_xxx
SYNKRA_PAYSTACK_PLAN_STARTER=PLN_xxx
SYNKRA_PAYSTACK_PLAN_BUSINESS=PLN_xxx
SYNKRA_PAYSTACK_PLAN_PRO=PLN_xxx

text

**Webhook URL** (set in Paystack dashboard):
https://flow.synkra.co.za/api/v1/synkra/paystack/webhook

Subscribe to events:
- `charge.success` — payment confirmed
- `subscription.create` — subscription created
- `subscription.disable` — subscription cancelled
- `subscription.not_renew` — set to not renew
- `invoice.payment_failed` — payment failed

**If keys are not set:** Checkout is disabled. The billing page shows a
"Payments coming soon" banner. `paystackConfigured: false` in the API
response. This is a graceful failure, not an error.

---

## 4. Plan change rules

| Action | Timing | Charge | Refund |
|--------|--------|--------|--------|
| Upgrade | Immediate | Full new plan price | None on old plan |
| Downgrade | Scheduled for `currentPeriodEnd` | New lower price then | None |
| Cancel | Scheduled for `currentPeriodEnd` | No new charge | None |
| Renewal | Auto at `currentPeriodEnd` | Full plan price | None |

**No proration.** Old plan balance is forfeit on upgrade. This matches how
most SaaS products handle plan changes and is documented in the refund
policy.

**Reversible changes:** Downgrade and cancel can be undone with
`POST /v1/synkra/subscription/reactivate` before `currentPeriodEnd`.

---

## 5. Renewals

**Service:** `packages/server/api/src/app/synkra/billing/renewals.service.ts`

Runs **hourly** from `billing.module.ts`.

Every run:

1. **Reminders** — finds subscriptions renewing within 3 days. Sends
   reminder email once per period. Marks `metadata.renewalReminderSentFor`.

2. **Due renewals** — finds subscriptions where `currentPeriodEnd <= now`
   and status is `active` or `past_due`. For each:
   - If scheduled cancel → move to Free
   - If scheduled downgrade → apply target tier, reset period
   - Else → extend by 30 days, send renewal success email

3. **No-op if nothing due.** The job is idempotent.

---

## 6. Failed payments

Policy: **5-day grace period.**

| Day | Action |
|-----|--------|
| 0 | Paystack charge fails. Email sent. |
| 1 | Auto-retry. |
| 3 | Second reminder. Auto-retry. |
| 5 | Final reminder. |
| 6 | Account restricted. Paid features pause. |

**Restricted state:**
- Inbound flows still run
- Outbound flows and paid features pause
- User sees a banner on the billing page

**Restoration:** When payment succeeds, everything resumes immediately.

**Note:** The retry webhook handler for `invoice.payment_failed` is not yet
wired. That is a v30+ item. Currently the renewal job extends the period
on the assumption Paystack's own recurring logic charged successfully.

---

## 7. Emails

**Service:** `packages/server/api/src/app/synkra/billing/billing-email.service.ts`

**Delivery paths (auto-detected):**

1. **Resend HTTP API** if `RESEND_API_KEY` is set (preferred)
2. **SMTP** via nodemailer if `AP_SMTP_HOST` is set (fallback)
3. **Log only** if neither (dev mode)

**Sender:** `noreply@synkra.co.za`

### Templates

| Trigger | Template |
|---------|----------|
| Successful upgrade | `sendWelcomeUpgrade` |
| Downgrade scheduled | `sendDowngradeScheduled` |
| Cancel scheduled | `sendCancelScheduled` |
| 3 days before renewal | `sendRenewalReminder` |
| Renewal succeeded | `sendRenewalSuccess` |
| Renewal failed (attempt N) | `sendRenewalFailed` |
| Account restricted (day 6) | `sendAccountRestricted` |
| Restored after payment | `sendAccountRestored` |

### Required env vars (Resend)

RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=noreply@synkra.co.za
RESEND_FROM_NAME=Synkra Flow

---

## 8. Enforcement

**File:** `packages/server/api/src/app/synkra/billing/enforcement.ts`

Called before expensive actions. Throws `QUOTA_EXCEEDED` when a plan limit
would be exceeded.

| Check | Called from |
|-------|------------|
| Active workflow limit | `flow.service.ts` (publish) |
| Project limit | `platform-project-service.ts` (create) |
| Seat limit | `user-invitation.service.ts` (invite) |
| Email limit | via `checkEmailLimit` |
| AI ops limit | via `checkAiOpsLimit` |
| SMS limit | via `checkSmsLimit` |
| WhatsApp limit | via `checkWhatsappLimit` |
| Voice minutes limit | via `checkVoiceLimit` |
| Storage limit | via `checkStorageLimit` |

**Runtime gate:** `synkraBillingProvider.shouldBlockOnCredits()` in
`packages/server/api/src/app/synkra/billing/synkra-billing-provider.ts`.
Called by AP before every production flow run. Blocks when the tier's
monthly execution cap is reached.

---

## 9. Usage metering

**Table:** `synkra_subscription`

Counters per user:

| Column | Purpose |
|--------|---------|
| `aiOpsUsed` | AI credits consumed this period |
| `emailsUsed` | Transactional emails sent |
| `smsUsed` | SMS sent |
| `whatsappUsed` | WhatsApp messages sent |
| `voiceMinutesUsed` | Voice minutes |
| `storageBytesUsed` | Storage in bytes |

**Service:** `packages/server/api/src/app/synkra/billing/usage.service.ts`

**Reset:** Monthly. `usagePeriodStart` and `usagePeriodEnd` fields track
the window. Reset happens when a new billing period starts.

**Increment:** `synkraUsageService.increment(userId, field, amount)` — safe
to call multiple times.

---

## 10. Pricing philosophy

1. **SYNKRA owns the infrastructure.** We are not reselling another
   automation platform.
2. **Standard Flow is the reference product.** Programme pricing is built
   around the underlying Flow plans.
3. **Agency pricing is wholesale.** Agencies receive a commercial rate
   because they are a distribution channel.
4. **Agency fees are access fees.** The Agency subscription does not pay
   for free clients. Each active client environment has its own Flow
   subscription at Agency Rates.
5. **Community Access subsidises access, not consumption.** Qualifying
   organisations get subscription help; they pay normal usage costs.
6. **Students get the real product.** Not a crippled student version.
7. **AI credits are 1 = 1,000 tokens.** Universal unit for every AI
   feature.
8. **Free plan is free forever.** 500 executions. 0 AI credits.
9. **Pro unlocks BYOK.** Only Pro can bring their own AI key.
10. **No hidden fees.** Every charge is documented.

---

## 11. What is not yet built

| Item | Status |
|------|--------|
| Add-on pack purchase (extra AI/SMS/WhatsApp) | Not built |
| Credit rollover + FIFO consumption | Not built |
| `invoice.payment_failed` handler | Not built |
| Student pricing (R149/R249) alignment | Doc says R149/R249, DB says R299/R599 |
| Community Access application flow | Not built |
| Agency Programme billing | Not built |
| Institutional / Volume pricing | Not built |
| Preferential Flow pricing for Chat customers | Decision pending |

---

## 12. Preflight checklist

Visit `https://flow.synkra.co.za/platform/preflight` when logged in as
the platform owner. It shows green ✅ or red ❌ for every env var needed
for launch:

- Database configured
- Redis configured
- S3 storage configured
- Paystack secret key
- Paystack webhook secret
- Paystack plan codes (Starter, Business, Pro)
- Resend API key
- SMTP host (fallback)

When everything is green, billing is fully functional.

---

**End of BILLING.md**
