# Billing Flows

Every user-facing billing action and what happens.

## Upgrade

1. User picks a tier on `/billing/checkout`
2. Frontend POSTs `/v1/synkra/subscription/checkout`
3. Backend applies any verified discount (student / community)
4. Paystack returns an authorize URL
5. Browser redirects to Paystack
6. User pays
7. Paystack fires `charge.success` to our webhook
8. Webhook sets tier, status=active, currentPeriodStart=now,
   currentPeriodEnd=+30d (or +365 if annual)
9. Renewals job takes over from here

**No proration on the old plan.** Old balance is forfeit by policy.

## Downgrade

1. User picks a lower tier on `/billing`
2. Frontend POSTs `/v1/synkra/subscription/downgrade` with `{toTier}`
3. Backend writes `metadata.scheduledChange = { kind: 'downgrade', toTier }`
   and sets `cancelAtPeriodEnd = true`
4. Nothing changes until the current period ends
5. On `currentPeriodEnd`, renewals job sets tier=toTier, resets period +30d

**Reversible.** POST `/reactivate` before the period ends clears the schedule.

## Cancel

1. User clicks Cancel on `/billing`
2. Frontend POSTs `/v1/synkra/subscription/cancel`
3. Backend writes `metadata.scheduledChange = { kind: 'cancel' }` and sets
   `cancelAtPeriodEnd = true`
4. On `currentPeriodEnd`, renewals job sets tier=free, clears period,
   clears Paystack codes

**Reversible until period ends.**

## Renewal

Every hour, `renewals.service.ts` runs:
- Finds subscriptions where `currentPeriodEnd <= now` and status is
  `active` or `past_due`
- If scheduled cancel → apply → free
- If scheduled downgrade → apply to target tier + reset period
- Else → renew: extend period by 30d, send success email

**Assumption:** Paystack's own subscription recurring logic charges the card
before the period expires. If the charge fails, `invoice.payment_failed`
webhook will fire — the handler to send a failure email is a v20 item.

## Add-on packs

Not yet implemented. Policy says:
- Never refundable
- Applied after plan allowance is exhausted
- Never expire

Will be a v20+ item.

## Emails sent

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

**Sender path:** Resend HTTP API if `RESEND_API_KEY` set, else SMTP.
