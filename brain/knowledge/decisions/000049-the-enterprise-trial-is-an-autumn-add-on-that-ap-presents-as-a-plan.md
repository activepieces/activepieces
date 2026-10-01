---
icon: 🧪
status: proposed
---

# The Enterprise Trial is an Autumn add-on that AP presents as a plan

## Decision

The self-serve 7-day Enterprise Trial is a $0 Autumn **add-on subscription** (`enterprise_trial`) attached next to the customer's current plan, with the trial set per attach (7 days, no card). It carries every Enterprise feature flag plus unlimited seats and team projects, and no `apCredits` item. AP names the platform's plan "Enterprise Trial" while the add-on is live, so the billing page shows the trial, not Free or Team. When the trial ends, users and team projects above the base plan's limits are locked, with clear messaging. It is offered on Cloud and on self-hosted Enterprise edition, to free and paying customers alike (never Community, which has no billing code). AP Cloud requests Cloud trials with the console's shared secret (`CONSOLE_API_SECRET_KEY`), which only AP Cloud holds; a self-hosted instance uses its own Autumn customer key and can only request `ee` trials. A trial is granted at most once per (platform owner email, edition), enforced by a console trial ledger with a unique constraint on that pair, so one person can trial once on Cloud and once on self-hosted. The ledger stores the platform owner's email, never the email of the admin who clicked, so other admins of the same platform are also refused; platform ownership cannot be transferred, so this also caps each platform at one trial per edition. It starts only after a confirm screen that states what the trial includes, that credits stay the same, the end date, and what happens when it ends. Only platform admins are offered it; non-admins keep today's locked-feature UI with no trial mention. The console sends the drip (a new track in its daily trial job, keyed on the trial ledger): day 0 welcome, day 2 and day 4 feature spotlights, day 6 "ends tomorrow", day 7 "trial ended". The ended email and screen use the existing "Talk to sales" link for the extra 14 days, unchanged (it still rejects free-mail addresses). In the app every member sees an "Enterprise Trial, N days left" pill; admins get a warning banner from one day left saying when Enterprise features switch off, then a one-time "trial ended" screen.

## Context

Clicking any locked feature should start a no-card 7-day trial that grants Enterprise features but no extra credits. A base-plan subscription would replace Free or Team: it evicts Free's credits and `billingEnforced`, replaces and refunds a paying Team subscription with no revert, and the console's `attachTrial` cancels AppSumo lifetime deals.

## Why

An add-on leaves the base plan untouched, so "no extra credits" holds by construction and AP already unions add-on flags (decision 000030). The product wants the trial to read as its own plan, so AP overrides the plan name while the add-on is live instead of making Autumn swap plans.

## Consequences

- Sandbox-verified 2026-09-27: attaching the add-on costs $0, leaves the base plan and its credits untouched (Free 100/day, Team 50,000), and the add-on subscription carries its own `trial_ends_at`. The console must attach with `new_billing_subscription: true`: the default preview for a Team customer moved Team's next $200 invoice to the trial end date, while a separate subscription kept Team's renewal date unchanged. Whether the trial expires on its own at `trial_ends_at` is still unverified.
- `showPoweredBy` comes from the base plan (Free and Team both grant it), and an add-on can only add flags, never remove them, so "Powered by" (builder badge, form footer, community links) stays visible during the trial. This is accepted; AP does not override it.
- `embeddingEnabled` hides the Activepieces AI provider (`shouldHideActivepiecesAiProvider`), so a trialer without their own AI key loses AI steps and chat during the trial. Left as is for now; revisit before launch.
- Buying Plus or Team mid-trial does not end the trial: the add-on keeps running to its end date next to the new plan.

- The platform's plan stays Free or Team during the trial; only the screens say "Enterprise Trial". So checks that treat "not free" as "paying" (run concurrency in `rate-limiter-interceptor.ts`, license-key provisioning, platform delete) keep seeing the base plan, and a trial never gets paid-plan limits.
- `trialEndsAt`, `trial.started` and the console's trial helpers read base subscriptions only, so the add-on needs its own reads.
- Anything the trial enabled must stop when it ends; this is tracked as an open launch check.
- Deferred (2026-09-28, revisit before launch): today a lapse is non-destructive, so users and team projects added during the trial keep working. The proposed rule is that users who joined during the trial and fall outside the post-trial plan's user limit are deactivated (for example 25 seats if they land back on Team), and team projects over the plan's limit are locked the same way. A locked project reuses `project_plan.locked`: nobody can open it or use its API, its flows are disabled, and the UI shows it as locked with a tooltip. Admins can still delete it. Nothing is deleted. Until this ships, the confirm dialog and the emails only say that Enterprise features switch off and nothing is deleted.
- When a trial ends, AP keeps the Enterprise features on until its cached plan next refreshes, up to 15 minutes. Accepted as is (2026-09-28).
- The console decides who may start a trial and how often; its checks are documented in the console repo (ADR 0013).
- The trial-ended dialog's "talk to sales for 14 more days" button is the same link and behaviour as "Talk to sales" in the Explore plans dialog; there is no self-serve extension.
