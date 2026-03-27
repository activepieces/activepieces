# Output Quality: Table-Ready Data

Every piece action output must be directly mappable to Google Sheets, Excel, and Activepieces Tables without any transformation. Users connect piece outputs to spreadsheet rows constantly -- if your data is nested or inconsistent, their automations break.

---

## Core Rules

### 1. Flatten all nested objects

API responses often have nested structures. Always flatten them into dot-notation or underscore-separated keys.

**BAD -- nested objects break spreadsheet mapping:**
```typescript
// This cannot be mapped to columns
return {
  id: '123',
  user: {
    name: 'Jane Doe',
    email: 'jane@example.com',
  },
  company: {
    name: 'Acme Inc',
    industry: 'Tech',
  },
};
```

**GOOD -- flat keys map directly to columns:**
```typescript
return {
  id: '123',
  user_name: 'Jane Doe',
  user_email: 'jane@example.com',
  company_name: 'Acme Inc',
  company_industry: 'Tech',
};
```

### 2. Arrays of records must have consistent keys

Every object in a list must have the exact same set of keys. Missing keys should be `null` or `''`, not omitted. This ensures every column has a value in every row.

**BAD -- inconsistent keys:**
```typescript
return [
  { name: 'Alice', email: 'alice@x.com', phone: '555-1234' },
  { name: 'Bob', email: 'bob@x.com' },  // Missing 'phone' breaks column alignment
];
```

**GOOD -- consistent keys, null for missing:**
```typescript
return [
  { name: 'Alice', email: 'alice@x.com', phone: '555-1234' },
  { name: 'Bob', email: 'bob@x.com', phone: null },
];
```

### 3. Use human-readable key names

Keys become column headers in spreadsheets. Use clear, descriptive names.

**BAD:**
```typescript
{ cNm: 'Acme', cId: '123', crtDt: '2024-01-01' }
```

**GOOD:**
```typescript
{ company_name: 'Acme', company_id: '123', created_date: '2024-01-01' }
```

### 4. Primitive values only

Every value should be a string, number, boolean, or null. No objects, arrays, or functions as values.

**BAD:**
```typescript
{ name: 'Alice', tags: ['vip', 'active'], metadata: { score: 95 } }
```

**GOOD:**
```typescript
{ name: 'Alice', tags: 'vip, active', metadata_score: 95 }
```

For arrays of simple values, join them into a comma-separated string.

---

## Output Patterns by Action Type

### Single-Record Actions (Get, Create, Update)

Return a single flat object. Each key becomes a spreadsheet column if the user maps it.

```typescript
async run(context) {
  const response = await httpClient.sendRequest<ApiContact>({
    method: HttpMethod.GET,
    url: `https://api.example.com/v1/contacts/${context.propsValue.contactId}`,
    authentication: { type: AuthenticationType.BEARER_TOKEN, token: context.auth as string },
  });

  const contact = response.body;
  return {
    id: contact.id,
    first_name: contact.first_name,
    last_name: contact.last_name,
    email: contact.email,
    phone: contact.phone ?? null,
    company_name: contact.company?.name ?? null,
    company_id: contact.company?.id ?? null,
    created_at: contact.created_at,
    updated_at: contact.updated_at,
    tags: Array.isArray(contact.tags) ? contact.tags.join(', ') : null,
  };
}
```

### List/Search Actions

Return a flat array or an object with a `rows` array. Each element is one spreadsheet row.

```typescript
async run(context) {
  const response = await httpClient.sendRequest<{ data: ApiContact[] }>({
    method: HttpMethod.GET,
    url: 'https://api.example.com/v1/contacts',
    authentication: { type: AuthenticationType.BEARER_TOKEN, token: context.auth as string },
    queryParams: { limit: String(context.propsValue.limit ?? 100) },
  });

  return response.body.data.map((contact) => ({
    id: contact.id,
    first_name: contact.first_name,
    last_name: contact.last_name,
    email: contact.email,
    phone: contact.phone ?? null,
    company_name: contact.company?.name ?? null,
    company_id: contact.company?.id ?? null,
    created_at: contact.created_at,
    tags: Array.isArray(contact.tags) ? contact.tags.join(', ') : null,
  }));
}
```

### Report/Analytics Actions

Complex nested data (like Salesforce reports) should be transformed into flat rows. Provide both a "simplified rows" format and a "raw" escape hatch.

```typescript
props: {
  output_format: Property.StaticDropdown({
    displayName: 'Output Format',
    required: false,
    defaultValue: 'rows',
    options: {
      options: [
        { label: 'Simplified Rows (recommended)', value: 'rows' },
        { label: 'Raw API Response', value: 'raw' },
      ],
    },
  }),
},
async run(context) {
  const response = await httpClient.sendRequest<ComplexApiResponse>({ /* ... */ });

  if (context.propsValue.output_format === 'raw') {
    return response.body;
  }

  // Transform into flat rows
  return {
    total_rows: response.body.results.length,
    columns: ['name', 'status', 'amount', 'date'],
    rows: response.body.results.map((item) => ({
      name: item.name,
      status: item.status,
      amount: item.financial_data?.amount ?? null,
      date: item.financial_data?.date ?? null,
    })),
  };
}
```

**Real example:** `packages/pieces/community/salesforce/src/lib/action/run-report.ts`

### Trigger Outputs

Triggers return arrays where each element becomes a separate flow run. Each element should also be flat.

```typescript
async run(context) {
  const payload = context.payload.body as WebhookPayload;
  return [{
    event_type: payload.event,
    record_id: payload.data?.id ?? null,
    record_name: payload.data?.name ?? null,
    record_email: payload.data?.email ?? null,
    occurred_at: payload.timestamp,
  }];
}
```

---

## Flattening Helper

For actions where the API returns deeply nested data, use a helper function:

```typescript
function flattenObject(
  obj: Record<string, unknown>,
  prefix = '',
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const flatKey = prefix ? `${prefix}_${key}` : key;

    if (value === null || value === undefined) {
      result[flatKey] = null;
    } else if (Array.isArray(value)) {
      // Join simple arrays into comma-separated strings
      result[flatKey] = value
        .map((v) => (typeof v === 'object' ? JSON.stringify(v) : String(v)))
        .join(', ');
    } else if (typeof value === 'object') {
      // Recursively flatten nested objects
      Object.assign(result, flattenObject(value as Record<string, unknown>, flatKey));
    } else {
      result[flatKey] = value;
    }
  }

  return result;
}

// Usage in an action:
async run(context) {
  const response = await httpClient.sendRequest<any>({ /* ... */ });
  return flattenObject(response.body);
}
```

---

## Checklist

Before finishing any action, verify:
- [ ] Output has no nested objects (all flattened with `_` separators)
- [ ] Array values are joined as comma-separated strings
- [ ] All objects in a list have the same keys
- [ ] Keys are human-readable (`company_name`, not `cNm`)
- [ ] Missing values are `null`, not omitted
- [ ] For list actions, output is an array or `{ rows: [...] }`
- [ ] For complex/report actions, offer a "Simplified Rows" vs "Raw" format option
