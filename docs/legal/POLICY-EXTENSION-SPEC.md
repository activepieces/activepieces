# Synkra — Legal Policy Extension Spec

**Purpose:** Extend the existing Chat-era policies to cover all Synkra products
(Chat, Flow, and future products) without writing separate policies per app.

**Status:** Ready to apply
**Created:** 10 October 2026

---

## 1. The strategy

One set of policies. Product-agnostic where possible. Product-specific only
where the law or the commercial reality demands it.

This means:

| Concept | Approach |
|---------|----------|
| "Synkra Chat" as the service | Replace with "the Services" or "Synkra" |
| "Services" definition | Explicitly lists every product |
| Uptime / SLA | Per-product table within one policy |
| Refunds | Same rules, extended to cover Flow plans |
| Data processing | Same policy, extended subprocessor list |
| Student / Community discounts | Same discount, applies to any Synkra product plan |
| Flow-specific rules | New subsections, not new documents |

**Never** write "Flow Terms of Use" or "Flow Privacy Policy" separately.
Everything extends the existing document.

---

## 2. Document-by-document edit list

### 2.1 Terms of Service → Terms of Use

**Global rename:**
- File name: `terms-of-service` → `terms-of-use`
- Page title: `Terms of Service` → `Terms of Use`
- Body text: every "Terms of Service" → "Terms of Use"
- URLs, meta titles, internal references

**§1 About these Terms**
Change: "govern access to and use of Synkra Chat and the free utilities on
synkra.co.za"
To: "govern access to and use of the Services"

**§2 Definitions — Services**
Change:
> Services means Synkra Chat and the free utilities on synkra.co.za. It does
> not include Synkra Flow while that product remains in development and
> unavailable.

To:
> Services means every product we operate, including Synkra Chat, Synkra
> Flow, the free utilities on synkra.co.za, and any future Synkra product we
> make available. Where a specific product differs from the general terms,
> the product-specific section in this document governs.

Add new definitions:
- **Flow** means Synkra Flow, the integrations and automation product.
- **Chat** means Synkra Chat, the customer communication and support product.
- **Workspace** means an isolated environment within the Services.
- **AI Credits** means the metered unit of AI consumption defined in the Billing Policy.
- **Agency** means a customer operating under the Agency Programme.

**New §2.1 Cross-product rules**

Add a subsection:
> These terms apply across all Synkra products. Where you use more than one
> product, a single acceptance of these terms covers all products. Data,
> credentials, and permissions you configure in one product may be used by
> another product only where you have explicitly authorised the connection.
> Cross-product connections are governed by the security requirements in
> §7 and the Privacy Policy.

**§5 Warranties and Disclaimers**
No change needed. Generic enough.

**§6 Limitation of Liability**
No change. Cap applies across all products.

**§7 Indemnities**
No change.

**§8 Intellectual Property**
Add to "What we own":
> All Flow piece definitions, custom integration code, workflow templates,
> and automation recipes we publish or distribute.

Add to "What you own":
> Workflows, agents, and configurations you build in Flow.

**§9 Acceptable Use**
Add Flow-specific prohibitions:

> **Additional restrictions for Synkra Flow**
> - You must not use Flow to automate cryptocurrency mining, high-frequency
>   trading, denial-of-service activity, bulk unsolicited messaging, or any
>   activity that violates a third party's terms of service.
> - You must not attempt to circumvent Flow's execution limits, credit
>   metering, or plan restrictions.
> - You must not use Flow to process special personal information without
>   a lawful basis under POPIA.
> - You are responsible for the lawfulness of any integration you connect.
>   If connecting a provider violates that provider's terms, you—not
>   Synkra—bear the consequence.

Add AI-specific:
> - AI outputs may contain errors. You must review AI-generated content
>   before acting on it, especially in customer-facing, legal, financial,
>   or medical contexts.
> - You must not use AI features to generate illegal content, impersonate
>   real persons without consent, or make automated decisions that produce
>   legal or substantial effects on a person without human review.

**§10 Third Party Services**
Extend the list:
> Synkra integrates with third party services including Paystack, Resend,
> Z1 Storage, and the third-party applications made available through
> Synkra Flow's integration catalogue.

**§11 Fees and Payment**
Change:
> Fees, billing cycles, refunds, and cancellations are governed by our
> Billing Policy.

To:
> Fees, billing cycles, refunds, AI credit consumption, and cancellations
> for all Synkra products are governed by our Billing Policy.

**§13 Service Levels, Support, and Maintenance — Uptime commitments**

Replace the single uptime table with a per-product table:

| Product | Free | Starter | Business | Pro |
|---------|------|---------|----------|-----|
| Synkra Chat | best effort | best effort | 99.5% | 99.9% |
| Synkra Flow | best effort | best effort | 99.5% | 99.9% |

Add:
> Where a customer uses both products, uptime is measured independently per
> product. A failure in one product does not affect the measured uptime of
> the other, unless the failure is caused by shared infrastructure.

**§13 Support — add Flow-specific**

> Flow-specific support includes assistance with connector configuration,
> workflow failures, and execution logs. It does not include custom piece
> development, workflow design, or automation consulting. Those are
> available under a separate agreement.

**§13 Status page**
Change:
> Real time and historical service status is available on our public status
> page.

To:
> Real time and historical service status for each Synkra product is
> available on our public status page.

**§16 Governing Law and Dispute Resolution**
No change.

**§18 Contact — add product list**

Update:
> Synkra Technologies is a software company based in Johannesburg, South
> Africa, serving clients globally. **Synkra Chat is available now. Synkra
> Flow is available now.**

Remove: "Synkra Flow is in development."

---

### 2.2 Refund Policy

**§Intro**
Change:
> This policy explains how billing works for Synkra Chat.

To:
> This policy explains how billing works for every Synkra product. It applies
> to Synkra Chat, Synkra Flow, and any future Synkra product. Where a
> product-specific rule differs, it is stated explicitly.

**§1 Billing in Advance**
No structural change. Add:
> The plans available for each product are defined in the Billing Policy. 
> Credit pools (AI, SMS, WhatsApp, Voice, Email) are held per workspace and 
> consumed by any Synkra product operating in that workspace.

**§3 Upgrades and Proration**
No change. Applies to both products.

**§4 Cancellation**
Change every "Synkra Chat" to "the Services" or product name as appropriate.
Keep the retention tables product-specific:
> Contacts, conversations, help centre articles, uploaded files, labels,
> teams, and macros are retained after cancellation of Synkra Chat.
> Workflows, agents, execution history, connected integrations, and
> workspace settings are retained after cancellation of Synkra Flow.

**§5 Refunds for Plan Payments**
No change to structure. Add:
> The 3-day refund window applies to the initial payment on any paid plan
> of any Synkra product.

**§6 Refunds for Add-On Packs**
Add note:
> AI credit packs purchased for Flow are treated the same way as Chat add-on
> packs. Non-refundable. Prepaid. Roll over for up to 12 months from
> purchase. Consumed FIFO (oldest first).

**§8 Discounts and Eligibility**
Change:
> We offer two discount programmes: the Student discount, at 35 percent off
> the standard plan price, and the Community Access discount, at 60 percent
> off the standard plan price.

To:
> We offer two discount programmes across all Synkra products: the Student
> discount, at 35 percent off the standard plan price, and the Community
> Access discount, at 60 percent off the standard plan price. Discounts
> apply to Synkra Chat and Synkra Flow plans. A customer may hold only one
> discount programme at a time. Discounts do not stack.

**§13 Tax and Currency**
No change. Applies to all products.

**§14 Price Changes**
No change. Applies to all products.

---

### 2.3 Privacy Policy

**§Intro**
Change:
> This policy explains how Synkra Chat collects, processes, stores, and
> protects personal information.

To:
> This policy explains how Synkra collects, processes, stores, and protects
> personal information across all Synkra products, including Synkra Chat and
> Synkra Flow.

**§1 Hosting and Processing Locations**
No structural change. Add a paragraph:
> Synkra Chat and Synkra Flow share the same primary infrastructure. 
> Application servers, databases, file storage, and AI inference processing
> described below apply to both products. Where a product stores data in a
> specific region, that is stated in the table.

Add row to any table:
- **Flow execution logs:** South Africa. Workflow run history, step outputs, 
  error messages. Retained per the retention table in §4.

**§2 Subprocessors**
Keep the existing list. Add:
- **DeepSeek / Token Harbor** — AI inference for Synkra Flow's AI features. 
  Located in the United States. (Only add if Flow uses one of these.)

Remove or restructure the note:
> Ollama runs on our own infrastructure and is not a third party
> subprocessor.

Keep if Ollama is still used. Remove if not.

**§3 AI Providers and Model Training**
Change:
> Synkra Chat uses AI features for Suggest Reply, Summarize, Rewrite, and
> knowledge base assistance.

To:
> Synkra Chat uses AI features for reply suggestions, summaries, and
> knowledge base assistance. Synkra Flow uses AI features for workflow
> building assistance, AI-driven steps in workflows, and categorisation
> tasks. All AI features across all Synkra products follow the same rules
> below.

Add:
> **Flow AI credits.** Synkra Flow meters AI consumption using AI credits
> (1 credit = 1,000 tokens input + output). Credits are deducted from the
> workspace's plan allowance. Consumption is metered but individual prompts
> and responses are not retained for training.

**§4 Data Retention Periods**
Extend:

**Active account data — Flow-specific:**
- Workflows: retained while the account is active.
- Agents: retained while the account is active.
- Execution history: 30 days by default (configurable by plan).
- Execution logs: 30 days by default.
- Connected integrations: retained while connected.
- Webhook payloads: 7 days.
- AI credit consumption records: 90 days.

**§5 Account Closure, Export, and Deletion**
Extend the "what is deleted" list:
> For Synkra Flow: all workflows, agents, execution history, connection 
> credentials, workspace configuration.

Add to data export:
> Flow workflows can be exported as JSON from the workspace settings.

**§6 POPIA Legal Bases**
No structural change. Add to "Contractual necessity":
> Provisioning and running Synkra Flow workspaces, including execution of
> workflows you author.

**§8 Data Processing Addendum and Operator Terms**
No change. Applies to all products.

**§9 Encryption and Security**
No change. Applies to all products.

**§11 Incident Response**
No change. Applies to all products.

**§12 Cross Border Data Transfers**
Add to the transfers table:
- **Flow AI inference (DeepSeek):** United States. Conversation text, prompts, 
  workflow definitions during AI inference.

**§13 Your Rights**
No change. Applies to all products.

**§14 Contact**
Change the Information Officer if needed. Update the general intro:
> Synkra is a South African software company operating Synkra Chat and 
> Synkra Flow.

---

### 2.4 Student and Community Access Terms

**§7 (Renamed to §1 in the extended version)**

Change:
> Student discount: 35% off the standard plan price for Starter, Business, 
> or Pro.

To:
> Student discount: 35% off the standard plan price of any paid plan of any 
> Synkra product, including Synkra Chat and Synkra Flow.

Change:
> Community Access discount: 60% off the standard plan price for Starter, 
> Business, or Pro.

To:
> Community Access discount: 60% off the standard plan price of any paid 
> plan of any Synkra product, including Synkra Chat and Synkra Flow.

Add:
> **One discount at a time.** A customer may hold either the Student 
> discount or the Community Access discount, but not both at the same time.
> Discounts do not stack.

Add:
> **Per-workspace scope.** Discounts apply to the workspace they are granted 
> on. Where a customer holds multiple workspaces across Synkra products, 
> each workspace must independently qualify.

Add:
> **Discounts and BYOK.** Students and Community Access customers on the 
> Synkra Flow Pro plan follow the standard Pro plan rules for Bring Your 
> Own Key. The discount applies to the plan price; it does not extend BYOK 
> eligibility to other plans.

**Application and review section**
Change:
> Applications are made under Settings → Billing.

To:
> Applications are made under Settings → Billing in any Synkra product. 
> The verification applies across products on the same workspace.

---

## 3. What stays exactly the same

- Limitation of liability — applies across all products
- Indemnities — applies across all products
- Governing law — applies across all products
- Confidentiality — applies across all products
- Encryption and security — applies across all products
- Incident response — applies across all products
- POPIA legal bases — applies across all products
- Service credits for outages — extended table covers all products
- Refund method and timing — same process, all products

---

## 4. What needs a legal review before publishing

Send to your lawyer:

1. The updated Terms of Use
2. The updated Refund Policy
3. The updated Privacy Policy
4. The updated Student and Community Access Terms
5. This extension spec

Key questions for them:

- Is the "Services" definition tight enough?
- Does Flow-specific language (credits, workspaces, agencies) create any new
  liability that needs a specific disclaimer?
- Does the AI credits model need explicit "not refundable" language?
- Is the discount non-stacking rule enforceable?
- Does the BYOK clause for Pro need separate consumer-protection review?
- Does the Agency Programme need its own addendum (rather than amendments to
  the base terms)?

---

## 5. What to do about the Agency Programme

The Agency Programme introduces new commercial relationships that may
warrant an **addendum** to the base Terms of Use, not amendments. When you
build Agency:

- Add a separate document: `Agency Programme Addendum`
- It supplements the Terms of Use
- It references the Billing Policy for pricing
- It references the Privacy Policy for data handling
- It does not replace anything

That keeps the base terms stable across all customers, and gives agencies
their own specific set of obligations.

Same pattern for:
- Integration Developer Addendum (when the marketplace launches)
- Institutional / Volume Pricing Addendum (when you close your first deal)

Each one is short — 1-2 pages. Each one references the base Terms of Use.

---

## 6. Rollout order

1. Apply the edits in this spec to the four base documents
2. Publish the updated versions
3. Update the footer links on synkra.co.za
4. Notify existing customers by email (30 days notice for material changes)
5. Later: Agency Addendum when Agency ships
6. Later: Developer Addendum when Marketplace ships

---

## 7. File naming on the website

| Old | New |
|-----|-----|
| `/legal/terms-of-service` | `/legal/terms-of-use` |
| `/legal/refund-policy` | (unchanged) |
| `/legal/privacy-policy` | (unchanged) |
| `/legal/student-community` | (unchanged) |
| (future) | `/legal/agency-addendum` |

Add a 301 redirect from `terms-of-service` → `terms-of-use` so old links don't break.

---

**End of spec.**
