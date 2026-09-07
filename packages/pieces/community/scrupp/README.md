# Scrupp

Export Sales Navigator and LinkedIn searches into people, run Apollo searches, find decision makers at a company, enrich LinkedIn profiles, and find and verify email addresses.

An API key is created in Scrupp under **Settings → API Keys**. API access is included on every paid plan.

Extraction is asynchronous: each action creates a job, waits for it, and returns the records. Every create call carries an `Idempotency-Key` derived from the run, so an Activepieces retry returns the original job instead of starting a second, billable one.

Billing is one credit per record returned; records that come back empty are refunded automatically.

Docs: https://scrupp.com/docs
