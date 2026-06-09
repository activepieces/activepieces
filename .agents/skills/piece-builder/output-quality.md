# Output Quality: Table-Ready Data

## Core Rules

### 1. Flatten all nested objects

**BAD:**
```typescript
return {
  id: '123',
  user: { name: 'Jane Doe', email: 'jane@example.com' },
  company: { name: 'Acme Inc', industry: 'Tech' },
};
```

**GOOD:**
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

Missing keys should be `null`, not omitted:

```typescript
// BAD — inconsistent keys break column alignment
return [
  { name: 'Alice', email: 'alice@x.com', phone: '555-1234' },
  { name: 'Bob', email: 'bob@x.com' },
];

// GOOD
return [
  { name: 'Alice', email: 'alice@x.com', phone: '555-1234' },
  { name: 'Bob', email: 'bob@x.com', phone: null },
];
```

### 3. Use human-readable key names

Keys become column headers in spreadsheets:

```typescript
// BAD
{ cNm: 'Acme', cId: '123', crtDt: '2024-01-01' }

// GOOD
{ company_name: 'Acme', company_id: '123', created_date: '2024-01-01' }
```

### 4. Primitive values only

No objects, arrays, or functions as values. Join simple arrays as comma-separated strings:

```typescript
// BAD
{ name: 'Alice', tags: ['vip', 'active'], metadata: { score: 95 } }

// GOOD
{ name: 'Alice', tags: 'vip, active', metadata_score: 95 }
```

---

## Output Patterns by Action Type

### Single-Record Actions (Get, Create, Update)

Return a single flat object:

```typescript
async run(context) {
  const response = await httpClient.sendRequest<ApiContact>({
    method: HttpMethod.GET,
    url: `https://api.example.com/v1/contacts/${context.propsValue.contactId}`,
    authentication: { type: AuthenticationType.BEARER_TOKEN, token: context.auth.secret_text },
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

Return a flat array:

```typescript
return response.body.data.map((contact) => ({
  id: contact.id,
  first_name: contact.first_name,
  last_name: contact.last_name,
  email: contact.email,
  phone: contact.phone ?? null,
  company_name: contact.company?.name ?? null,
  created_at: contact.created_at,
  tags: Array.isArray(contact.tags) ? contact.tags.join(', ') : null,
}));
```

### Report/Analytics Actions

For complex nested data, offer a simplified rows format and a raw escape hatch:

```typescript
props: {
  output_format: Property.StaticDropdown({
    displayName: 'Output Format',
    required: false,
    defaultValue: 'rows',
    options: { options: [
      { label: 'Simplified Rows (recommended)', value: 'rows' },
      { label: 'Raw API Response', value: 'raw' },
    ]},
  }),
},
async run(context) {
  const response = await httpClient.sendRequest<ComplexApiResponse>({ /* ... */ });
  if (context.propsValue.output_format === 'raw') return response.body;
  return response.body.results.map((item) => ({
    name: item.name,
    status: item.status,
    amount: item.financial_data?.amount ?? null,
    date: item.financial_data?.date ?? null,
  }));
}
```

**Real example:** `packages/pieces/community/salesforce/src/lib/action/run-report.ts`

### Trigger Outputs

Each element in the returned array becomes a separate flow run — keep them flat:

```typescript
async run(context) {
  const payload = context.payload.body as WebhookPayload;
  return [{
    event_type: payload.event,
    record_id: payload.data?.id ?? null,
    record_name: payload.data?.name ?? null,
    occurred_at: payload.timestamp,
  }];
}
```

---

## Flattening Helper

For deeply nested API responses:

```typescript
function flattenObject(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const flatKey = prefix ? `${prefix}_${key}` : key;
    if (value === null || value === undefined) {
      result[flatKey] = null;
    } else if (Array.isArray(value)) {
      result[flatKey] = value.map((v) => (typeof v === 'object' ? JSON.stringify(v) : String(v))).join(', ');
    } else if (typeof value === 'object') {
      Object.assign(result, flattenObject(value as Record<string, unknown>, flatKey));
    } else {
      result[flatKey] = value;
    }
  }
  return result;
}

// Usage:
async run(context) {
  const response = await httpClient.sendRequest<any>({ /* ... */ });
  return flattenObject(response.body);
}
```
