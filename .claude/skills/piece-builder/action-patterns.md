# Action Patterns & Property Types

## Action Template

Each action goes in its own file under `src/lib/actions/`:

```typescript
import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { myAppAuth } from '../../';

export const createRecordAction = createAction({
  auth: myAppAuth,
  name: 'create_record',        // Unique snake_case ID -- never change after publishing
  displayName: 'Create Record',
  description: 'Creates a new record in My App',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of the record',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.example.com/v1/records',
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth as string,
      },
      body: {
        name: context.propsValue.name,
        description: context.propsValue.description,
      },
    });
    return response.body;
  },
});
```

**Real example:** `packages/pieces/community/github/src/lib/actions/create-issue.ts`

---

## Property Types Reference

### Text Inputs

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

### Number and Boolean

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

### Date/Time

```typescript
Property.DateTime({
  displayName: 'Due Date',
  required: false,
})
```

### File

```typescript
Property.File({
  displayName: 'Attachment',
  required: false,
})
```

### JSON and Object

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

### Array

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

### Static Dropdown (predefined options)

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

### Dynamic Dropdown (fetches from API)

```typescript
Property.Dropdown({
  displayName: 'Project',
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

### Dependent Dropdown (refreshes when parent changes)

```typescript
Property.Dropdown({
  displayName: 'Task',
  refreshers: ['project'],  // Re-fetches when 'project' prop changes
  required: true,
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

### Multi-Select Dropdown (dynamic)

```typescript
Property.MultiSelectDropdown({
  displayName: 'Labels',
  refreshers: ['repository'],
  required: false,
  options: async ({ auth, repository }) => {
    // Same pattern as Dropdown, returns multiple selected values
  },
})
```

### Dynamic Properties (form fields that change based on API)

For forms where the fields themselves are determined at runtime (e.g., table columns):

```typescript
Property.DynamicProperties({
  displayName: 'Record Fields',
  refreshers: ['tableId'],
  required: true,
  props: async ({ auth, tableId }) => {
    if (!auth || !tableId) return {};
    const fields = await fetchTableFields(auth, tableId);
    const properties: Record<string, any> = {};
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

### Markdown (display only)

```typescript
Property.MarkDown({
  value: '## Instructions\nProvide a webhook URL to receive events.',
})
```

---

## PieceCategory Values

Use in `createPiece({ categories: [...] })`:

ARTIFICIAL_INTELLIGENCE, BUSINESS_INTELLIGENCE, COMMUNICATION, COMMERCE, CONTENT_AND_FILES, CUSTOMER_SUPPORT, DEVELOPER_TOOLS, FINANCE, FORMS_AND_SURVEYS, HUMAN_RESOURCES, MARKETING, PAYMENT_PROCESSING, PRODUCTIVITY, PROJECT_MANAGEMENT, SALES_AND_CRM, UNIVERSAL, PREMIUM, CORE
