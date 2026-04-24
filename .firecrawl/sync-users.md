_search_

[Submit Help Request](https://go.outseta.com/support/kb)

[![](https://s3.amazonaws.com/outseta-production/1/0-outseta-logo_37c2b321-0381-4690-b1db-f2d4c2d386ca.png)](https://go.outseta.com/support/kb/categories)
Help Desk


[Submit Help Request](https://go.outseta.com/support/kb)

- [Getting Started](https://go.outseta.com/support/kb/categories/B9l5alW8/getting-started)
- [Protected Content](https://go.outseta.com/support/kb/categories/rQVZLeQ6/protected-content)
- [Sign up and Login](https://go.outseta.com/support/kb/categories/xE9LyAWw/sign-up-and-login)
- [Webflow](https://go.outseta.com/support/kb/categories/wZmN8w92/webflow)
- [Developer Docs](https://go.outseta.com/support/kb/categories/d1QpjYWE/developer-docs)
- [Code Snippets & Examples](https://go.outseta.com/support/kb/categories/rm0Ak4QX/code-snippets-examples)
- [Billing](https://go.outseta.com/support/kb/categories/6Dmwq94j/billing)
- [CRM](https://go.outseta.com/support/kb/categories/RyW1KQBl/crm)
- [Email](https://go.outseta.com/support/kb/categories/Z496r9Xz/email)
- [Help Desk](https://go.outseta.com/support/kb/categories/By9q8QAP/help-desk)
- [Settings](https://go.outseta.com/support/kb/categories/VdQG094Y/settings)
- [Integrations](https://go.outseta.com/support/kb/categories/qNmd5Q0x/integrations)
- [Legal & Security](https://go.outseta.com/support/kb/categories/L9P6vAmJ/legal-security)
- more\_horiz
   - [Getting Started](https://go.outseta.com/support/kb/categories/B9l5alW8/getting-started)
  - [Protected Content](https://go.outseta.com/support/kb/categories/rQVZLeQ6/protected-content)
  - [Sign up and Login](https://go.outseta.com/support/kb/categories/xE9LyAWw/sign-up-and-login)
  - [Webflow](https://go.outseta.com/support/kb/categories/wZmN8w92/webflow)
  - [Developer Docs](https://go.outseta.com/support/kb/categories/d1QpjYWE/developer-docs)
  - [Code Snippets & Examples](https://go.outseta.com/support/kb/categories/rm0Ak4QX/code-snippets-examples)
  - [Billing](https://go.outseta.com/support/kb/categories/6Dmwq94j/billing)
  - [CRM](https://go.outseta.com/support/kb/categories/RyW1KQBl/crm)
  - [Email](https://go.outseta.com/support/kb/categories/Z496r9Xz/email)
  - [Help Desk](https://go.outseta.com/support/kb/categories/By9q8QAP/help-desk)
  - [Settings](https://go.outseta.com/support/kb/categories/VdQG094Y/settings)
  - [Integrations](https://go.outseta.com/support/kb/categories/qNmd5Q0x/integrations)
  - [Legal & Security](https://go.outseta.com/support/kb/categories/L9P6vAmJ/legal-security)

# Sync Outseta users to your database

This article covers how to sync Outseta users to your backend database when they register or are added to accounts.

⚠️ **Before implementing sync:** Most apps don't need to duplicate user data. Storing just the Outseta UIDs as foreign keys is simpler and avoids synchronization challenges. See [Using Outseta with your own backend](https://go.outseta.com/support/kb/articles/B9lV2dm8/integrate-outseta-with-your-backend-database) to understand if syncing is right for your use case.

## When syncing makes sense

You may need to sync user data to your database if:

- You need to join user data (names, emails) with app data in complex database queries
- Your database requires foreign key constraints against a local users table
- You need offline access to user data
- You're integrating with a system that requires local user records

If you just need to identify who owns app data, store only the UID — no sync needed. Use Person UID for individual ownership, Account UID for team/organization ownership, or both for scenarios such as role/permissions, per-account settings, and audit logs. See more in [Using Outseta with your own backend](https://go.outseta.com/support/kb/articles/B9lV2dm8/integrate-outseta-with-your-backend-database).

## Understanding the Outseta data model

Before setting up sync, understand how Outseta structures user data:

![Diagram showing Outseta Account, Person, and Subscription relationships](https://s3.amazonaws.com/outseta-production/1/0-Mermaid+Chart+-+Create+complex%2C+visual+diagrams+with+text.-2025-12-15-104806_53d3b3b8-9788-48d8-aee1-97b2c2572e5b.png)

- **Person** — An individual with a unique email. Can exist without an Account (e.g., email list subscribers).
- **Account** — An organization or team. Has a Subscription and can have multiple People.
- **Subscription** — A billing relationship tied to an Account.

A Person can belong to multiple Accounts, and an Account can have multiple People. When a user registers with a subscription, all three are created together.

## Approaches to syncing

Which approach you use depends on what you need to capture:

| Event | When it fires | Data provided |
| --- | --- | --- |
| **Sign Up Callback URL** | User registers with an active subscription | Person + Account + Subscription |
| **Account Created** webhook | Any Account is created | Account |
| **Person Created** webhook | Any Person is created | Person |

### Common scenarios

| Scenario | What gets created | Events that fire |
| --- | --- | --- |
| User registers with subscription | Person + Account + Subscription | Sign Up Callback, Account Created, Person Created |
| Team member added to existing Account | Person (linked to Account) | Person Created only |
| Someone joins email list | Person (no Account) | Person Created only |
| Admin creates Account manually | Account | Account Created only |

The **Sign Up Callback** is convenient because it provides Person, Account, and Subscription together in one payload — but it only fires for the registration flow. Use webhooks to catch other scenarios.

## Option 1: Sign Up Callback URL

When a user registers with an active subscription, Outseta creates a Person, an Account, and a Subscription. You can configure Outseta to call your API endpoint with all this information at the moment of registration.

### Setup

1. Within Outseta, navigate to **AUTH > SIGN UP AND LOGIN**
2. In the SIGN UP SETTINGS area, click **SHOW ADVANCED OPTIONS**

![Screenshot showing Sign Up Settings with Show Advanced Options button](https://s3.amazonaws.com/outseta-production/1/0-Screen+Shot+2024-07-30+at+1.15.01+PM_a9e73366-eac5-4b97-8a16-1ab9841ad9e8.png)

3. Enter your API endpoint URL in the **SIGN UP CALLBACK URL** field

![Screenshot showing Sign Up Callback URL field](https://s3.amazonaws.com/outseta-production/1/0-Screen+Shot+2024-07-30+at+1.17.32+PM_bf75f811-4293-4418-bcf3-78b2420b52ac.png)

### Handling the callback

Here's an example Express endpoint that receives the callback and creates records in your database:

```
app.post("/api/outseta/signup-callback", async (req, res) => {
  try {
    const { Person, Account, Subscription } = req.body;

    // Create account in your database
    await db.query(
      `INSERT INTO accounts (account_uid, name, plan_uid)
       VALUES (?, ?, ?)
       ON CONFLICT (account_uid) DO UPDATE SET
         name = EXCLUDED.name,
         plan_uid = EXCLUDED.plan_uid`,
      [Account.Uid, Account.Name, Subscription.Plan.Uid]
    );

    // Create person and link to account
    await db.query(
      `INSERT INTO people (person_uid, account_uid, email, first_name, last_name)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (person_uid) DO UPDATE SET
         email = EXCLUDED.email,
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name`,
      [Person.Uid, Account.Uid, Person.Email, Person.FirstName, Person.LastName]
    );

    // Optionally return a ClientIdentifier to Outseta
    res.json({
      ...req.body,
      ClientIdentifier: "your-internal-account-id-123"
    });

  } catch (error) {
    console.error("Signup callback error:", error);
    res.status(500).json({ error: "Failed to process signup" });
  }
});
```

### Returning a ClientIdentifier

You can return the callback payload back to Outseta with an additional `ClientIdentifier` field. Outseta will store this value on the **Account**, creating a two-way reference between your database and Outseta.

This is useful when you need to look up the Outseta Account from your internal system ID, or vice versa.

```
// Return the payload with your internal Account ID added
res.json({
  ...req.body,
  ClientIdentifier: "your-internal-account-id-123"
});
```

Note: ClientIdentifier is only available on Account, not Person.

## Option 2: Webhooks for all People and Accounts

The Sign Up Callback only fires for the registration flow. To capture team members added later, email list subscribers, or manually created records, use webhooks.

### Setup

1. Navigate to **SETTINGS > NOTIFICATIONS**
2. Register callbacks for the events you need:
   - **Person Created** — fires for all new People
   - **Account Created** — fires for all new Accounts

👉 [Setup Activity Notifications / Webhooks](https://go.outseta.com/support/kb/articles/6DmwY294/setup-activity-notifications-webhooks-callbacks-)

### Handling Person Created webhook

This webhook fires for everyone — registrations, team members, and email list subscribers. You'll need to check if the Person is linked to an Account:

```
app.post("/api/outseta/person-created", async (req, res) => {
  try {
    // Verify webhook signature first (see security section below)

    const person = req.body;

    // Check if person belongs to an account
    const accountUid = person.Account?.Uid || null;

    await db.query(
      `INSERT INTO people (person_uid, account_uid, email, first_name, last_name)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (person_uid) DO UPDATE SET
         account_uid = EXCLUDED.account_uid,
         email = EXCLUDED.email,
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name`,
      [person.Uid, accountUid, person.Email, person.FirstName, person.LastName]
    );

    res.json({ success: true });

  } catch (error) {
    console.error("Person created webhook error:", error);
    res.status(500).json({ error: "Failed to process webhook" });
  }
});
```

### Securing webhooks

Always verify that webhook requests are actually from Outseta before processing them.

👉 [Secure and verify webhooks with a SHA256 Signature](https://go.outseta.com/support/kb/articles/Rm85R5Q4/secure-and-verify-webhooks-with-a-sha256-signature)

## Keeping data in sync

If you sync user data, you'll also need to handle updates and deletions. Consider subscribing to additional webhooks:

- **Person Updated** — when user details change
- **Person Deleted** — when a user is removed
- **Account Updated** — when account details change
- **Account Deleted** — when an account is removed
- **Subscription Changed** — when subscription status changes

This is one reason why syncing adds complexity — you need to maintain synchronization across all these events.

## Best practices

- **Sync minimal data** — Only store what you actually need for queries. You can always fetch additional details from Outseta's API.
- **Use UIDs as primary keys** — Use Person UID and Account UID as your primary/foreign keys to ensure you can always link back to Outseta.
- **Handle duplicates gracefully** — Use upsert patterns (INSERT ... ON CONFLICT) to handle retries and overlapping events.
- **Verify webhook signatures** — Ensure requests are actually from Outseta.
- **Consider eventual consistency** — Your database may briefly be out of sync after changes in Outseta.
- **Use ClientIdentifier for two-way lookups** — If you need to find Outseta Accounts from your internal IDs, return a ClientIdentifier from the signup callback.

## Related articles

👉 [Using Outseta with your own backend](https://go.outseta.com/support/kb/articles/B9lV2dm8/integrate-outseta-with-your-backend-database) — Understand the overall architecture

👉 [Protecting your data with Outseta authentication](https://go.outseta.com/support/kb/articles/vW5XJ694/protecting-your-data-server-side-with-outseta-authentication) — Verify users when they make requests

👉 [Activity Notifications / Webhooks](https://go.outseta.com/support/kb/articles/6DmwY294/setup-activity-notifications-webhooks-callbacks-) — React to Outseta events

👉 [Secure and verify webhooks with a SHA256 Signature](https://go.outseta.com/support/kb/articles/Rm85R5Q4/secure-and-verify-webhooks-with-a-sha256-signature) — Verify webhook requests

content\_copy
Copy as Markdown

**Articles in this category**

- [How Outseta integrates with your SaaS product](https://go.outseta.com/support/kb/articles/amRZ7OmJ/how-outseta-integrates-with-your-saas-product)
- [Outseta's sign-up and login embeds](https://go.outseta.com/support/kb/articles/8vW5OQ4P/outsetas-sign-up-and-login-embeds)
- [Integrate Outseta with your backend database](https://go.outseta.com/support/kb/articles/B9lV2dm8/integrate-outseta-with-your-backend-database)
- [How to integrate Outseta's profile embed with your product](https://go.outseta.com/support/kb/articles/ngWKv9pr/how-to-integrate-outsetas-profile-embed-with-your-product)
- [Local/Dev, Test and Staging Environment](https://go.outseta.com/support/kb/articles/xmeyJRmV/localdev-test-and-staging-environment)
- [Outseta's REST API](https://go.outseta.com/support/kb/articles/d1QpxQE7/outsetas-rest-api)
- [Outseta embed API](https://go.outseta.com/support/kb/articles/79OjwGQE/outseta-embed-api)
- [JavaScript configuration guide](https://go.outseta.com/support/kb/articles/aWxXddWV/javascript-configuration-guide)
- [How to integrate Outseta with React](https://go.outseta.com/support/kb/articles/A93nZlQ0/how-to-integrate-outseta-with-react)
- [Feedback Fort: An introduction](https://go.outseta.com/support/kb/articles/yWogZYWD/feedback-fort-an-introduction)
- [Feedback Fort: Outseta with React & Supabase](https://go.outseta.com/support/kb/articles/VmAOa49a/feedback-fort-outseta-with-react-supabase)
- [Access user info client-side with JavaScript](https://go.outseta.com/support/kb/articles/6Dmw7qm4/access-user-info-client-side-with-javascript)
- [Server-side protection with Outseta](https://go.outseta.com/support/kb/articles/vW5XJ694/server-side-protection-with-outseta)
- [How to use Outseta with your own authentication solution](https://go.outseta.com/support/kb/articles/4XQY00mP/how-to-use-outseta-with-your-own-authentication-solution)
- [Styling Outseta embeds with CSS](https://go.outseta.com/support/kb/articles/yWoxOXmD/styling-outseta-embeds-with-css)
- [Secure and verify webhooks with a SHA256 Signature](https://go.outseta.com/support/kb/articles/Rm85R5Q4/secure-and-verify-webhooks-with-a-sha256-signature)
- [Decode and verify Outseta JWT Access Tokens server-side](https://go.outseta.com/support/kb/articles/wQX70amK/decode-and-verify-outseta-jwt-access-tokens-server-side)
- [Outseta across multiple domains](https://go.outseta.com/support/kb/articles/y9qOl8mA/outseta-across-multiple-domains)
- [The JWT access token](https://go.outseta.com/support/kb/articles/XQYMXqQP/the-jwt-access-token)
- [Generate JWT Access Tokens (aka. log in users) using the Outseta API](https://go.outseta.com/support/kb/articles/y9gpZ7WM/generate-jwt-access-tokens-aka-log-in-users-using-the-outseta-api)
- [Outseta's Well-Known Endpoints (JWK / OIDC)](https://go.outseta.com/support/kb/articles/rm0wp4WX/outsetas-well-known-endpoints-jwk-oidc)
- [Outseta Admin MCP Server for AI assistants](https://go.outseta.com/support/kb/articles/rmkyGL9g/outseta-admin-mcp-server-for-ai-assistants)
- [Community SDKs and Packages](https://go.outseta.com/support/kb/articles/B9lVY5m8/community-sdks-and-packages)

**Outseta**

—

- [Home](http://outseta.com/)
- [About Us](https://www.outseta.com/what-were-about)
- [API Docs](https://documenter.getpostman.com/view/3613332/outseta-rest-api-v1/7TNfr6k?version=latest)
- [Outseta Academy](https://fast.wistia.com/embed/channel/mycheflsrj)
- [Submit Help Request](https://go.outseta.com/support/kb/articles/aWxJOqQV/sync-outseta-users-to-your-database#)

close

Submit Help Request

Email

Subject

How can we help you?

Attachments (0)

_attach\_file_ Add up to 5 files

Max 2.0 MB per file. Accepted file types: .csv, .jpg, .jpeg, .pdf, .png, .txt, .xlsx

reCAPTCHA

Recaptcha requires verification.

I'm not a robot

reCAPTCHA

Submit

reCAPTCHA