# UX Guidelines: Make Pieces Easy to Use

Pieces are used by non-technical users building automations. Every prop, description, and dropdown must be clear enough that someone with zero API knowledge can use the piece without reading external docs.

---

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
  description: 'Select the contact to update',
  refreshers: [],
  required: true,
  options: async ({ auth }) => {
    if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account first' };
    const response = await httpClient.sendRequest<{ data: { id: string; name: string; email: string }[] }>({ /* ... */ });
    return {
      disabled: false,
      options: response.body.data.map((c) => ({
        label: `${c.name} (${c.email})`,  // Show name + email, not the ID
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
- Records: Use the primary field value, not the record ID

---

## 2. Write Descriptions That Teach

Descriptions should tell users **what to enter** and **how to find it**. Assume they've never seen the API.

**BAD:**
```typescript
description: 'The thread timestamp'
```

**GOOD:**
```typescript
description: 'Provide the ts (timestamp) value of the parent message to reply in a thread. You can get this by clicking the three dots next to a message and selecting "Copy link". The timestamp is the number at the end of the URL (e.g. 1710304378.475129).'
```

**BAD:**
```typescript
description: 'Enter the chat ID'
```

**GOOD:**
```typescript
description: 'The unique ID of the chat to send the message to. To find it: 1) Search for @getmyid_bot in Telegram, 2) Send /my_id, 3) Copy the number it replies with.'
```

---

## 3. Use Markdown Instructions for Complex Setup

When a prop requires multi-step configuration, add a `Property.MarkDown()` above it with clear instructions:

```typescript
props: {
  instructions: Property.MarkDown({
    value: `### Setup Instructions

1. Go to **Settings > API** in your dashboard
2. Click **Create API Key**
3. Copy the key and paste it below

**Note:** The key starts with \`sk_\`. If it starts with \`pk_\`, you're using the wrong key.`,
  }),
  apiKey: Property.ShortText({
    displayName: 'API Key',
    required: true,
  }),
}
```

Use Markdown for:
- Webhook setup instructions (include `{{webhookUrl}}` placeholder)
- Steps to find a specific setting in the third-party app
- Warnings about common mistakes
- Permissions or scope requirements

---

## 4. Always Set Sensible Defaults

If a prop has a "most common" value, set it as the default so users don't have to think about it:

```typescript
// Temperature for AI -- most users want the default
temperature: Property.Number({
  displayName: 'Temperature',
  description: 'Controls randomness. Lower values (e.g. 0.2) make output more focused. Higher values (e.g. 0.8) make it more creative.',
  required: false,
  defaultValue: 0.7,
})

// Most users want detail rows included
includeDetails: Property.Checkbox({
  displayName: 'Include Detail Rows',
  description: 'Include individual record rows. If disabled, only summary data is returned.',
  required: false,
  defaultValue: true,
})

// Output format with a recommended option
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

Display names should tell the user exactly what the action does in plain language.

**BAD display names:**
- `"POST Contact"` -- too technical
- `"Execute Query"` -- jargon
- `"API Call"` -- meaningless to end users

**GOOD display names:**
- `"Create Contact"`
- `"Find Contact by Email"`
- `"Send Message to Channel"`
- `"Add Row to Spreadsheet"`
- `"Get Invoice Details"`
- `"List All Projects"`

For pieces: use `"verb + object"` format.
For triggers: use `"New [thing]"` or `"Updated [thing]"` format.

---

## 6. Write Helpful Auth Descriptions

Auth descriptions should include step-by-step instructions for getting credentials:

```typescript
export const myAppAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your API key:
1. Log in to your Example App account
2. Go to **Settings > API Keys**
3. Click **Create New Key**
4. Copy the key (it starts with \`ex_\`)

Need help? See https://docs.example.com/api-keys`,
  required: true,
});
```

---

## 7. Use Helpful Placeholders and Error Messages

Dropdown placeholders should guide the user on what to do next:

```typescript
// When auth is missing
return { disabled: true, options: [], placeholder: 'Please connect your account first' };

// When a parent dropdown hasn't been selected
return { disabled: true, options: [], placeholder: 'Please select a project first' };

// When the API returns empty
return { disabled: false, options: [], placeholder: 'No items found. Create one in your dashboard first.' };
```

Error states in dropdowns:
```typescript
try {
  const response = await httpClient.sendRequest({ /* ... */ });
  return { disabled: false, options: [...] };
} catch (error) {
  return { disabled: true, options: [], placeholder: 'Failed to load items. Check your connection.' };
}
```

---

## 8. Mark Optional Props Clearly

Only mark props as `required: true` if the action genuinely cannot work without them. For everything else, use `required: false` with a sensible default or description explaining when to use it:

```typescript
// Required -- can't send a message without text
text: Property.LongText({
  displayName: 'Message',
  description: 'The message content to send',
  required: true,
})

// Optional -- most users don't need this
threadId: Property.ShortText({
  displayName: 'Thread ID',
  description: 'Only fill this if you want to reply to an existing thread. Leave empty to send a new message.',
  required: false,
})
```

---

## 9. Group Related Props Logically

Order props from most important to least important. Put required fields first, optional fields after:

```typescript
props: {
  // Required fields first
  channel: channelDropdown,          // Where to send
  message: Property.LongText({...}), // What to send

  // Optional fields after
  threadTs: Property.ShortText({...}),      // Reply to thread
  username: Property.ShortText({...}),      // Custom bot name
  profilePicture: Property.ShortText({...}),// Custom avatar
}
```

---

## 10. Use Source Selectors for Mutually Exclusive Input Methods

When an action can accept input from multiple mutually exclusive sources (e.g. upload a file OR reference one in S3, enter a URL OR upload a file), **never use multiple optional fields side by side**. Users won't understand which to fill in, and there's no clear required field to guide them.

Instead, use a required `StaticDropdown` as a source selector combined with `DynamicProperties` that shows the correct required fields for the chosen branch.

**BAD — three optional fields, user doesn't know which to fill:**
```typescript
props: {
  file: Property.File({ displayName: 'File', required: false }),
  s3Bucket: Property.ShortText({ displayName: 'S3 Bucket', required: false }),
  s3Key: Property.ShortText({ displayName: 'S3 File Path', required: false }),
}
```

**GOOD — explicit source selector with DynamicProperties:**
```typescript
props: {
  source: Property.StaticDropdown({
    displayName: 'Document Source',
    description: 'Choose how to provide the document — upload a file directly or reference one already in S3.',
    required: true,
    defaultValue: 'file',
    options: {
      options: [
        { label: 'Upload a file', value: 'file' },
        { label: 'From S3 bucket', value: 's3' },
      ],
    },
  }),
  document: Property.DynamicProperties({
    auth: myAuth,
    displayName: 'Document',
    required: true,
    refreshers: ['source'],
    props: async ({ source }): Promise<DynamicPropsValue> => {
      if (source === 's3') {
        return {
          s3Bucket: Property.ShortText({
            displayName: 'S3 Bucket',
            description: 'The name of your S3 bucket containing the document.',
            required: true,
          }),
          s3Key: Property.ShortText({
            displayName: 'S3 File Path',
            description: 'The path to the file in your S3 bucket (e.g. "documents/invoice.pdf").',
            required: true,
          }),
        };
      }
      return {
        file: Property.File({
          displayName: 'File',
          description: 'Supported formats: JPEG, PNG, PDF (single page), TIFF. Maximum 10 MB.',
          required: true,
        }),
      };
    },
  }),
}
```

**Critical implementation rules for `DynamicProperties` source selectors:**
- Always add an **explicit `Promise<DynamicPropsValue>` return type** to the `props` function — without it the UI will not re-render when the selector changes
- Return **object literals per branch** (`return { ... }`) — do NOT build a mutable `fields` object and conditionally assign keys
- Always end with a **fallback `return {}`** after all branches
- Compare the selector value **directly** (`source === 's3'`) — no `as unknown as string` cast needed
- Set a **`defaultValue`** on the source selector so the first branch renders on initial load

In the `run` function, read dynamic prop values by key:
```typescript
const file = source === 'file' ? document['file'] : undefined;
const s3Bucket = source === 's3' ? (document['s3Bucket'] as string) : undefined;
const s3Key = source === 's3' ? (document['s3Key'] as string) : undefined;
```

---

## 11. Avoid Service-Specific Jargon in Field Names

Technical terms from a service's API are meaningless to most users. Always translate them to plain English in `displayName`, and use `description` to mention the technical term if needed (so power users can find it).

| Jargon | Plain English |
|--------|---------------|
| `Key` (S3) | `File Path` |
| `S3 Object Key` | `S3 File Path` |
| `Idempotency Token` | `Deduplication Token` |
| `S3 Prefix` | `Folder Path` |
| `ACL` | `Access Control` |
| `No Error on Failure` | `Return Error as Output` |
| `Memory Key` | `Conversation Memory ID` |
| `Top P` | `Top P` (with a plain-English description) |
| `Normalize` (embeddings) | `Normalize Output` |
| `Dimensions` (embeddings) | `Vector Dimensions` |

**BAD:**
```typescript
key: Property.ShortText({
  displayName: 'Key',
  description: 'The key of the file to read',
  required: true,
})
```

**GOOD:**
```typescript
key: Property.ShortText({
  displayName: 'File Path',
  description: 'The full path to the file within your S3 bucket (e.g. "documents/report.csv"). This is also called the S3 "key".',
  required: true,
})
```

---

## 12. Auth Descriptions Must Be Setup Guides

For `CustomAuth` pieces with AWS-style credentials (access key + secret + region), the auth description should include step-by-step setup instructions with links, not just a one-liner.

**BAD:**
```typescript
PieceAuth.CustomAuth({
  description: 'AWS authentication using Access Key and Secret Key.',
  ...
})
```

**GOOD:**
```typescript
PieceAuth.CustomAuth({
  description: `Connect your AWS account to use this service.

**How to get your credentials:**
1. Open the [AWS IAM Console](https://console.aws.amazon.com/iam/) and go to **Users**.
2. Select your user (or create a new one), then go to **Security credentials**.
3. Click **Create access key** — copy both the Access Key ID and Secret Access Key.
4. Make sure the IAM user has the required policy attached (e.g. AmazonS3FullAccess).`,
  props: {
    accessKeyId: Property.ShortText({
      displayName: 'Access Key ID',
      description: 'Your AWS access key ID. Found in AWS IAM Console → Users → Security credentials.',
      required: true,
    }),
    secretAccessKey: PieceAuth.SecretText({
      displayName: 'Secret Access Key',
      description: 'Your AWS secret access key. Only shown once when you create the access key — store it safely.',
      required: true,
    }),
  },
  ...
})
```

Individual credential fields must also have descriptions — the auth description alone is often collapsed or skipped.

---

## Checklist

Before finishing any action, verify:
- [ ] No prop asks users to type an ID when a dropdown could be used instead
- [ ] Every prop has a `description` that explains what it is and how to find the value
- [ ] Complex setup steps use `Property.MarkDown()` with numbered instructions
- [ ] Optional props have sensible `defaultValue` where applicable
- [ ] Display names use plain language (`"Create Contact"` not `"POST /contacts"`)
- [ ] Auth description includes step-by-step instructions to get credentials, and each credential field has its own description
- [ ] Dropdown placeholders guide the user (`"Please select a project first"`)
- [ ] Required fields come before optional fields in the props order
- [ ] Mutually exclusive inputs (file vs URL, upload vs S3) use a source selector + DynamicProperties instead of multiple optional fields
- [ ] No service-specific jargon in `displayName` — translate to plain English and mention the technical term in `description` if needed
- [ ] `DynamicProperties` `props` functions have explicit `Promise<DynamicPropsValue>` return type and return object literals per branch
