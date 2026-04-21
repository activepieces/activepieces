# Property Types Reference

Used in both `createAction({ props: {...} })` and `createTrigger({ props: {...} })`.

---

## Text

```typescript
Property.ShortText({
  displayName: 'Title',
  description: 'Optional help text',
  required: true,
  defaultValue: 'Default text',
})

Property.LongText({
  displayName: 'Body',
  required: false,
})
```

## Number and Boolean

```typescript
Property.Number({
  displayName: 'Limit',
  required: false,
  defaultValue: 10,
})

Property.Checkbox({
  displayName: 'Include archived?',
  required: false,
  defaultValue: false,
})
```

## Date/Time

```typescript
Property.DateTime({
  displayName: 'Due Date',
  required: false,
})
```

## File

```typescript
Property.File({
  displayName: 'Attachment',
  required: false,
})
```

## JSON and Object

```typescript
Property.Json({
  displayName: 'Custom Data',
  description: 'Enter valid JSON',
  required: false,
})

Property.Object({
  displayName: 'Metadata',
  description: 'Key-value pairs',
  required: false,
})
```

## Array

```typescript
// Simple array of strings
Property.Array({
  displayName: 'Tags',
  required: false,
})

// Array with structured sub-properties
Property.Array({
  displayName: 'Line Items',
  required: true,
  properties: {
    name: Property.ShortText({ displayName: 'Item Name', required: true }),
    quantity: Property.Number({ displayName: 'Quantity', required: true }),
    price: Property.Number({ displayName: 'Price', required: false }),
  },
})
```

## Static Dropdown (predefined options)

```typescript
Property.StaticDropdown({
  displayName: 'Status',
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
  description: 'Choose how to provide the file.',
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
  required: true,
  refreshers: ['source'],
  // IMPORTANT: explicit Promise<DynamicPropsValue> return type is required
  // for the UI to re-render when the source selector changes.
  props: async ({ source }): Promise<DynamicPropsValue> => {
    if (source === 's3') {
      return {
        s3Bucket: Property.ShortText({
          displayName: 'S3 Bucket',
          required: true,
        }),
        s3Key: Property.ShortText({
          displayName: 'S3 File Path',
          required: true,
        }),
      };
    }
    return {
      file: Property.File({
        displayName: 'File',
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

Use for setup instructions, warnings, or webhook URL display. See `ux-guidelines.md` for when to use it.

---

## PieceCategory Values

Use in `createPiece({ categories: [...] })`:

`ARTIFICIAL_INTELLIGENCE`, `BUSINESS_INTELLIGENCE`, `COMMUNICATION`, `COMMERCE`, `ACCOUNTING`, `CONTENT_AND_FILES`, `CUSTOMER_SUPPORT`, `DEVELOPER_TOOLS`, `FORMS_AND_SURVEYS`, `HUMAN_RESOURCES`, `MARKETING`, `PAYMENT_PROCESSING`, `PRODUCTIVITY`, `SALES_AND_CRM`, `CORE`, `FLOW_CONTROL`, `UNIVERSAL_AI`
