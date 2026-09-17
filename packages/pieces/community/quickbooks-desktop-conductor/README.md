# QuickBooks Desktop (via Conductor)

Syncs invoices, bills, customers, vendors, and payments with **QuickBooks Desktop** — the
installed Windows application, not QuickBooks Online. QuickBooks Desktop has no cloud API of its
own, so this piece bridges through [Conductor](https://conductor.is), a paid intermediary that
talks to QuickBooks Desktop via its QuickBooks Web Connector (QBWC).

Because of that bridge, every sync depends on **the QuickBooks Desktop machine being on, QuickBooks
running with the right company file open (or configured to open without it — see below), and the
Web Connector reachable.** This piece cannot see or change that from the Activepieces side — if the
tenant's machine is off, syncs simply don't happen until it's back.

## Building

Run `turbo run build --filter=@activepieces/piece-quickbooks-desktop-conductor` to build the piece.

## Tenant onboarding — do this once per QuickBooks Desktop company file

1. **Get a Conductor account and API key.** Conductor's secret key is account-wide, not
   per-tenant — if you're onboarding multiple QuickBooks Desktop company files (e.g. one per
   customer), they typically all live under one Conductor account, distinguished by **End-User ID**
   (see step 3), not by separate secret keys. Confirm this fits your billing/isolation model before
   onboarding many tenants onto one key — see **Multi-tenant considerations** below.
2. **Create an End-User in Conductor** for this specific QuickBooks Desktop company file (Conductor
   dashboard → End-Users → New). This is what scopes every API call to the right company file.
3. **Connect QuickBooks Desktop to that End-User.** Conductor's dashboard walks the tenant through
   downloading a `.qwc` file and importing it into the QuickBooks Web Connector (QBWC) — a small
   utility that ships with QuickBooks Desktop. Importing the `.qwc` file makes QuickBooks Desktop
   show a one-time authorization prompt.
4. **⚠️ Top setup mistake, and the top cause of "sync just stopped" tickets:** that authorization
   prompt asks how much access to grant the Web Connector. **Choose the option that keeps access
   even when QuickBooks Desktop isn't the active/foreground application** (commonly phrased "allow
   access even if QuickBooks is not running" or similar — the exact wording depends on the
   QuickBooks Desktop version). **Do not** choose the option that re-prompts every time, or one that
   only grants access while QuickBooks is actively in use.
   - **Why this matters so much**: picking the wrong option doesn't produce an error anywhere —
     Conductor and Activepieces have no way to detect it from the outside. It just means QuickBooks
     Desktop silently declines every sync until a human is physically at that machine, with
     QuickBooks open, to click "yes" on a prompt nobody told them to expect. In practice this
     surfaces as "nothing has synced in days" with no error in sight, which is expensive to
     diagnose after the fact and cheap to prevent by getting this one prompt right during setup.
   - *This exact prompt is native QuickBooks Desktop / Web Connector behavior, not something
     Conductor or this piece controls — the precise wording varies by QuickBooks Desktop version.
     Confirm the exact wording on the actual dialog during setup rather than trusting this
     paraphrase; a hands-on pass against a real QuickBooks Desktop install is worth 5 minutes here.*
5. Once Conductor's dashboard shows the End-User as **Connected**, go to **Settings → API Keys** in
   Conductor and copy the **Secret Key**, and copy this End-User's **End-User ID**
   (starts with `end_usr_`) from the End-Users page.
6. In Activepieces, create a new connection for this piece and paste in the **Secret Key** and
   **End-User ID** from steps 1 and 5. Activepieces validates the connection by calling Conductor's
   health-check endpoint immediately — a failure here means Conductor itself is unreachable or the
   key is wrong, not the QuickBooks Desktop machine specifically.

**Multi-tenant considerations.** If one Conductor account/secret key ends up serving many tenants
(rather than one Conductor account per tenant), keep in mind:
- The **End-User ID is a per-tenant connection prop, never a step input** — this piece is built
  that way on purpose, so a flow can't accidentally query the wrong tenant's data by having the
  end-user ID typed or mapped in as a variable.
- **Every flow polling on a shared key adds load to that one key.** 85 tenants each polling both
  triggers every ~5 minutes is roughly 85 concurrent-ish requests every cycle on one Conductor
  account. This piece has no built-in throttling for that — if you're running at that scale, ask
  Conductor directly about their rate limits for a single account before rolling out broadly.

## Troubleshooting

**Error message contains "QuickBooks Desktop connection failed" / code `QBD_CONNECTION_ERROR`.**
The bridge to that specific QuickBooks Desktop machine is down — almost always because the machine
is off, asleep, QuickBooks Desktop isn't running with the right company file open, or (see above)
the Web Connector authorization was set to prompt-every-time and nobody's there to approve it. This
piece treats this as a normal, expected condition for QuickBooks Desktop (not a bug) — actions throw
so the failed run is visible, and the two triggers simply produce zero results that poll cycle
rather than erroring, since "the machine is off tonight" isn't a flow failure worth alerting on.

**A customer/vendor/item name isn't matching even though it exists in QuickBooks.** Name matching
is exact and case-sensitive against QuickBooks Desktop's own name field. Check for a trailing
space, a different capitalization, or a sub-account/sub-customer syntax mismatch (QuickBooks
Desktop uses `Parent:Child` for hierarchy).

## Scope notes

- **Record Payment** covers both money coming in (a customer payment, Accounts Receivable) and
  money going out (a vendor bill payment by check or credit card, Accounts Payable) through one
  action with a Payment Type selector — this is a deliberate choice for this piece, not a missing
  feature; the underlying QuickBooks Desktop transactions are genuinely different endpoints under
  the hood.
- **New Payment** (the trigger) only fires for customer payments (Accounts Receivable) — it does
  **not** fire for vendor bill payments. If a flow needs to react to money going out, poll
  **Query Transactions** on a schedule with `transactionTypes` set to the bill-payment types
  instead.
- **New or Updated Invoice** fires on both creation and edits to an existing invoice (e.g. a
  payment applied against it, changing its balance) — it is not create-only. A flow that should
  only react to brand-new invoices should compare the invoice's `created_at` and `updated_at`
  fields in its output.
