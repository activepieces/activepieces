# UX Guidelines: Make Pieces Easy to Use

## 1. Never Make Users Type IDs

Use dynamic dropdowns so users pick items by name instead of pasting IDs.

**BAD:**
```typescript
contactId: Property.ShortText({
  displayName: 'Contact ID',
  description: 'The ID of the contact',
  required: true,
})
```

**GOOD:**
```typescript
contactId: Property.Dropdown({
  displayName: 'Contact',
  auth: myAppAuth,
  refreshers: [],
  required: true,
  options: async ({ auth }) => {
    if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account first' };
    const response = await httpClient.sendRequest<{ data: { id: string; name: string; email: string }[] }>({ /* ... */ });
    return {
      disabled: false,
      options: response.body.data.map((c) => ({
        label: `${c.name} (${c.email})`,
        value: c.id,
      })),
    };
  },
})
```

Dropdown labels should combine the human-readable name with a disambiguator:
- Contacts: `"Jane Doe (jane@example.com)"`
- Invoices: `"Invoice #1042 for Acme Inc ($150.00 USD)"`
- Projects: `"Marketing Website (active)"`

---

## 2. Write Descriptions That Teach

**BAD:** `description: 'The thread timestamp'`

**GOOD:** `description: 'The ts (timestamp) of the parent message to reply in a thread. Get it by clicking the three dots next to a message → Copy link. The timestamp is the number at the end of the URL (e.g. 1710304378.475129).'`

**BAD:** `description: 'Enter the chat ID'`

**GOOD:** `description: 'The unique ID of the chat. To find it: 1) Search @getmyid_bot in Telegram, 2) Send /my_id, 3) Copy the number it replies with.'`

---

## 3. Use Markdown Instructions for Complex Setup

```typescript
props: {
  instructions: Property.MarkDown({
    value: `### Setup Instructions

1. Go to **Settings > API** in your dashboard
2. Click **Create API Key**
3. Copy the key and paste it below

**Note:** The key starts with \`sk_\`.`,
  }),
  apiKey: Property.ShortText({ displayName: 'API Key', required: true }),
}
```

Use for webhook URLs, steps to find settings in the third-party app, warnings about common mistakes, and scope requirements.

---

## 4. Always Set Sensible Defaults

```typescript
temperature: Property.Number({
  displayName: 'Temperature',
  description: 'Controls randomness. 0.2 = focused, 0.8 = creative.',
  required: false,
  defaultValue: 0.7,
})

outputFormat: Property.StaticDropdown({
  displayName: 'Output Format',
  required: false,
  defaultValue: 'simplified',
  options: {
    options: [
      { label: 'Simplified (recommended)', value: 'simplified' },
      { label: 'Raw API Response', value: 'raw' },
    ],
  },
})
```

---

## 5. Use Clear, Action-Oriented Display Names

**BAD:** `"POST Contact"`, `"Execute Query"`, `"API Call"`

**GOOD:** `"Create Contact"`, `"Find Contact by Email"`, `"Send Message to Channel"`

For pieces: `"verb + object"`. For triggers: `"New [thing]"` or `"Updated [thing]"`.

---

## 6. Write Helpful Auth Descriptions

```typescript
export const myAppAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your API key:
1. Log in to Example App
2. Go to **Settings > API Keys**
3. Click **Create New Key**
4. Copy the key (starts with \`ex_\`)`,
  required: true,
});
```

---

## 7. Use Helpful Placeholders and Error Messages

```typescript
// Auth missing
return { disabled: true, options: [], placeholder: 'Please connect your account first' };
// Parent not selected
return { disabled: true, options: [], placeholder: 'Please select a project first' };
// API returned empty
return { disabled: false, options: [], placeholder: 'No items found. Create one first.' };
// API error
catch (error) {
  return { disabled: true, options: [], placeholder: 'Failed to load items. Check your connection.' };
}
```

---

## 8. Mark Optional Props Clearly

Only mark as `required: true` if the action genuinely cannot work without it.

```typescript
text: Property.LongText({ displayName: 'Message', required: true })

threadId: Property.ShortText({
  displayName: 'Thread ID',
  description: 'Leave empty to send a new message. Fill in to reply to an existing thread.',
  required: false,
})
```

---

## 9. Group Related Props Logically

Required fields first, optional fields after:

```typescript
props: {
  channel: channelDropdown,           // required — where to send
  message: Property.LongText({...}),  // required — what to send
  threadTs: Property.ShortText({...}),   // optional
  username: Property.ShortText({...}),   // optional
}
```

---

## 10. Use Source Selectors for Mutually Exclusive Inputs

When an action can accept input in multiple mutually exclusive ways (upload vs S3, URL vs file), never use multiple optional fields side by side — users won't know which to fill.

**BAD — three optional fields, user doesn't know which to fill:**
```typescript
props: {
  file: Property.File({ displayName: 'File', required: false }),
  s3Bucket: Property.ShortText({ displayName: 'S3 Bucket', required: false }),
  s3Key: Property.ShortText({ displayName: 'S3 File Path', required: false }),
}
```

Instead, use a required `StaticDropdown` as the source selector combined with `DynamicProperties` that shows the correct required fields for the chosen branch. The user picks their method first, then fills in only the relevant fields — no ambiguity.

For the full implementation (required `Promise<DynamicPropsValue>` return type, object-literal branch rules, fallback `return {}`, and how to read values in `run`), see **Dynamic Properties as Source Selector** in `props-patterns.md`.

---

## 11. Avoid Service-Specific Jargon in Display Names

Translate API terms to plain English in `displayName`; mention the technical term in `description`.

| Jargon | Plain English |
|--------|---------------|
| `Key` (S3) | `File Path` |
| `S3 Object Key` | `S3 File Path` |
| `Idempotency Token` | `Deduplication Token` |
| `S3 Prefix` | `Folder Path` |
| `ACL` | `Access Control` |
| `Memory Key` | `Conversation Memory ID` |
| `Top P` | `Top P` (with plain-English description) |
| `Dimensions` (embeddings) | `Vector Dimensions` |

---

## 12. Auth Descriptions Must Be Setup Guides

For `CustomAuth` with AWS-style credentials, include step-by-step setup with links. Individual credential fields must also have descriptions — the auth description alone is often collapsed.

```typescript
PieceAuth.CustomAuth({
  description: `Connect your AWS account.

**How to get your credentials:**
1. Open the [AWS IAM Console](https://console.aws.amazon.com/iam/) → **Users**.
2. Select your user → **Security credentials**.
3. Click **Create access key** — copy both the Access Key ID and Secret Access Key.
4. Attach the required policy (e.g. AmazonS3FullAccess).`,
  props: {
    accessKeyId: Property.ShortText({
      displayName: 'Access Key ID',
      description: 'Found in AWS IAM Console → Users → Security credentials.',
      required: true,
    }),
    secretAccessKey: PieceAuth.SecretText({
      displayName: 'Secret Access Key',
      description: 'Only shown once when created — store it safely.',
      required: true,
    }),
  },
})
```

---

## Checklist

- [ ] No prop asks users to type an ID when a dropdown could be used
- [ ] Every prop has a `description` explaining what it is and how to find it
- [ ] Complex setup steps use `Property.MarkDown()` with numbered instructions
- [ ] Optional props have sensible `defaultValue` where applicable
- [ ] Display names use plain language (`"Create Contact"` not `"POST /contacts"`)
- [ ] Auth description includes step-by-step instructions; each credential field has its own description
- [ ] Dropdown placeholders guide the user
- [ ] Required fields before optional fields in props order
- [ ] Mutually exclusive inputs use source selector + DynamicProperties (see `props-patterns.md`)
- [ ] No service-specific jargon in `displayName`
- [ ] `DynamicProperties` `props` functions use explicit `Promise<DynamicPropsValue>` return type and object literals per branch
