# Property Types Reference

Used in both `createAction({ props: {...} })` and `createTrigger({ props: {...} })`.

> **Every property must have a `description`.** When a sample value would clarify the expected format (IDs, dates, enums, URLs, structured strings, JSON shapes), embed it in the description prose using `Example: ...` or `(e.g. ...)`. There is no separate `example` field today — the description carries the whole signal. Skip the example when the prop is self-explanatory (a boolean checkbox), the values come from an API at runtime (`Property.Dropdown`), or the shape is determined at runtime (`Property.DynamicProperties`). See `SKILL.md` → AI Metadata section.

---

## Text

```typescript
Property.ShortText({
  displayName: 'Title',
  description: "Short descriptive title. Max 255 characters. Example: 'Q1 2026 Product Launch'.",
  required: true,
  defaultValue: 'Default text',
})

Property.LongText({
  displayName: 'Body',
  description: "Long-form text. Markdown supported. Example: 'Kickoff meeting notes and action items for the launch.'",
  required: false,
})
```

## Number and Boolean

```typescript
Property.Number({
  displayName: 'Limit',
  description: 'Maximum number of records to return. Example: 10.',
  required: false,
  defaultValue: 10,
})

Property.Checkbox({
  displayName: 'Include archived?',
  description: 'Whether to include archived records in the result.',
  required: false,
  defaultValue: false,
})
```

## Date/Time

```typescript
Property.DateTime({
  displayName: 'Due Date',
  description: "ISO 8601 date-time, timezone-aware. Example: '2026-04-17T10:30:00Z'.",
  required: false,
})
```

## File

```typescript
Property.File({
  displayName: 'Attachment',
  description: 'File to upload. Max 25 MB. Accepts any common file type (pdf, png, jpg, docx, etc.).',
  required: false,
})
```

## JSON and Object

```typescript
Property.Json({
  displayName: 'Custom Data',
  description: "Enter valid JSON. Example: { key: 'value', count: 3 }.",
  required: false,
})

Property.Object({
  displayName: 'Metadata',
  description: "Key-value pairs. Example: { name: 'Jane', role: 'admin' }.",
  required: false,
})
```

## Array

```typescript
// Simple array of strings
Property.Array({
  displayName: 'Tags',
  description: "List of tag names to apply. Example: ['bug', 'enhancement'].",
  required: false,
})

// Array with structured sub-properties
Property.Array({
  displayName: 'Line Items',
  description: "Each line item must include name and quantity. Example: [{ name: 'Widget', quantity: 2, price: 9.99 }].",
  required: true,
  properties: {
    name: Property.ShortText({ displayName: 'Item Name', description: "Product name. Example: 'Widget'.", required: true }),
    quantity: Property.Number({ displayName: 'Quantity', description: 'Units to order. Example: 2.', required: true }),
    price: Property.Number({ displayName: 'Price', description: 'Unit price in USD. Example: 9.99.', required: false }),
  },
})
```

## Static Dropdown (predefined options)

```typescript
Property.StaticDropdown({
  displayName: 'Status',
  description: "Current status of the record. One of: 'active', 'inactive', 'archived'.",
  required: true,
  options: {
    options: [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
      { label: 'Archived', value: 'archived' },
    ],
  },
})

Property.StaticMultiSelectDropdown({
  displayName: 'Categories',
  description: "One or more categories to classify the record. Pick from: 'sales', 'marketing'. Example: ['sales', 'marketing'].",
  required: false,
  options: {
    options: [
      { label: 'Sales', value: 'sales' },
      { label: 'Marketing', value: 'marketing' },
    ],
  },
})
```

## Dynamic Dropdown (fetches from API)

```typescript
Property.Dropdown({
  displayName: 'Project',
  description: 'Select the project to operate on. Options are fetched from your account.',
  auth:myAppAuth,
  refreshers: [],  // Array of prop names this depends on
  required: true,
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: 'Please connect your account first' };
    }
    const response = await httpClient.sendRequest<{ data: { id: string; name: string }[] }>({
      method: HttpMethod.GET,
      url: 'https://api.example.com/v1/projects',
      authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth as string },
    });
    return {
      disabled: false,
      options: response.body.data.map((item) => ({
        label: item.name,
        value: item.id,
      })),
    };
  },
})
```

## Dependent Dropdown (refreshes when parent changes)

```typescript
Property.Dropdown({
  displayName: 'Task',
  description: 'Select the task within the chosen project. Refreshes when the project prop changes.',
  refreshers: ['project'],  // Re-fetches when 'project' prop changes
  required: true,
  auth:myAppAuth,
  options: async ({ auth, project }) => {
    if (!auth || !project) {
      return { disabled: true, options: [], placeholder: 'Please select a project first' };
    }
    const response = await httpClient.sendRequest<{ data: { id: string; name: string }[] }>({
      method: HttpMethod.GET,
      url: `https://api.example.com/v1/projects/${project}/tasks`,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth as string },
    });
    return {
      disabled: false,
      options: response.body.data.map((item) => ({ label: item.name, value: item.id })),
    };
  },
})
```

**Real example:** `packages/pieces/community/github/src/lib/common/index.ts` -- see `repositoryDropdown`, `issueDropdown`, `labelDropDown`

## Multi-Select Dropdown (dynamic)

```typescript
Property.MultiSelectDropdown({
  displayName: 'Labels',
  description: 'One or more labels to apply. Options come from the selected repository.',
  refreshers: ['repository'],
  required: false,
  auth:myAppAuth,
  options: async ({ auth, repository }) => {
    // Same pattern as Dropdown, returns multiple selected values
  },
})
```

## Dynamic Properties (fields determined at runtime)

For forms where the fields themselves come from the API (e.g., custom table columns):

```typescript
Property.DynamicProperties({
  displayName: 'Record Fields',
  description: 'Fields are loaded from the selected table at runtime; one input per column.',
  refreshers: ['tableId'],
  required: true,
  auth: myAppAuth,
  props: async ({ auth, tableId }): Promise<DynamicPropsValue> => {
    if (!auth || !tableId) return {};
    const fields = await fetchTableFields(auth, tableId);
    const properties: DynamicPropsValue = {};
    for (const field of fields) {
      properties[field.id] = Property.ShortText({
        displayName: field.name,
        description: `Value for the "${field.name}" column.`,
        required: field.required,
      });
    }
    return properties;
  },
})
```

## Dynamic Properties as Source Selector (mutually exclusive inputs)

When a user must choose between two mutually exclusive input methods (upload vs S3, URL vs file, etc.), use a `StaticDropdown` selector refresher + `DynamicProperties`:

```typescript
source: Property.StaticDropdown({
  displayName: 'File Source',
  description: "Choose how to provide the file. One of: 'file' (upload), 's3' (from S3 bucket).",
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
  auth: myAppAuth,
  displayName: 'File',
  description: 'Inputs depend on the selected File Source. Either an Upload field or S3 Bucket + S3 File Path.',
  required: true,
  refreshers: ['source'],
  // IMPORTANT: explicit Promise<DynamicPropsValue> return type is required
  // for the UI to re-render when the source selector changes.
  props: async ({ source }): Promise<DynamicPropsValue> => {
    if (source === 's3') {
      return {
        s3Bucket: Property.ShortText({
          displayName: 'S3 Bucket',
          description: "S3 bucket name. Example: 'my-app-uploads'.",
          required: true,
        }),
        s3Key: Property.ShortText({
          displayName: 'S3 File Path',
          description: "Object key within the bucket. Example: 'invoices/2026-04/inv-123.pdf'.",
          required: true,
        }),
      };
    }
    return {
      file: Property.File({
        displayName: 'File',
        description: 'Upload the file directly.',
        required: true,
      }),
    };
  },
}),
```

**Rules:**
- Always use `Promise<DynamicPropsValue>` as the explicit return type — without it the UI will not react to selector changes
- Return object literals per branch — do NOT build a mutable object and conditionally assign keys
- Always end with a fallback `return {}` after all branches
- Compare the selector value directly (`source === 's3'`) — no `as unknown as string` cast needed
- Set `defaultValue` on the selector so the first branch renders on load

**Reading values in `run`:**
```typescript
const file = source === 'file' ? document['file'] : undefined;
const s3Bucket = source === 's3' ? (document['s3Bucket'] as string) : undefined;
const s3Key = source === 's3' ? (document['s3Key'] as string) : undefined;
```

## Markdown (display-only, no user input)

```typescript
Property.MarkDown({
  value: '## Instructions\n1. Go to Settings\n2. Copy your API key',
})
```

Use for setup instructions, warnings, or webhook URL display. No `description` needed — `MarkDown` is display-only and the `value` is the rendered content. See `ux-guidelines.md` for when to use it.

---

## PieceCategory Values

Use in `createPiece({ categories: [...] })`:

`ARTIFICIAL_INTELLIGENCE`, `BUSINESS_INTELLIGENCE`, `COMMUNICATION`, `COMMERCE`, `ACCOUNTING`, `CONTENT_AND_FILES`, `CUSTOMER_SUPPORT`, `DEVELOPER_TOOLS`, `FORMS_AND_SURVEYS`, `HUMAN_RESOURCES`, `MARKETING`, `PAYMENT_PROCESSING`, `PRODUCTIVITY`, `SALES_AND_CRM`, `CORE`, `FLOW_CONTROL`, `UNIVERSAL_AI`
