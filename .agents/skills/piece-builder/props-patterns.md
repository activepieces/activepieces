# Property Types Reference

Used in both `createAction({ props: {...} })` and `createTrigger({ props: {...} })`.

## Property descriptions are the agent's only signal

The `description` on a property is what an LLM/MCP agent (and the human in the builder) reads to decide how to fill it — write it as a one-or-two-sentence spec, not a label:

- **State the format, not just the concept.** `"Issue title. Max 255 characters."` beats `"The title"`.
- **Bake a realistic sample into the prose** when format matters — actual ID shapes (`'cus_abc123xyz'`), ISO 8601 dates (`'2026-04-17T10:30:00Z'`), full URLs with protocol. There is no separate example field; the description carries the whole signal. E.g. `"Current status of the record. One of: 'open', 'in_progress', 'closed'."`
- **Skip samples** when the prop is self-explanatory (a boolean checkbox), or when values come from the API at runtime (`Property.Dropdown`, `Property.DynamicProperties`).
- **Never use placeholder-only samples** — `'string'`, `'value'`, `'<your API key>'`, empty `{}`/`[]`.

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

> **Where it lives.**
> - Every `Dropdown`, `MultiSelectDropdown` and `DynamicProperties` is a factory in `common/props.ts`, exported through `myAppProps`. This holds even when only one action uses it.
> - Each factory takes `PropParams<R>` (`{ required, displayName?, description? }`) and fetches options through `myAppApi`, never through `httpClient`.
> - The prop key equals the factory name: `projectId: myAppProps.projectId({ required: true })`.
> - The snippets below show the `Property.Dropdown(...)` body that goes inside the factory. The full factory shape is in `piece-layout.md`.

> **Always pass `auth`.** Every `Property.Dropdown`, `Property.MultiSelectDropdown`, and `Property.DynamicProperties` whose `options`/`props` callback reads `auth` MUST set `auth: <pieceAuth>` (e.g. `auth: myAppAuth`). Without it, `auth` is `undefined` in the callback and the dropdown can never load. Import the auth object from `../auth` (relative to `src/lib/common/props.ts`) — never from a re-export on `src/index.ts`.

> **No cast needed — `auth` is already typed.** Setting `auth: myAppAuth` does double duty: it makes `auth` available in the callback *and* tells TypeScript the connection type. The framework uses that `auth` field purely to infer the type, so inside the callback `auth.secret_text` (SecretText), `auth.access_token` (OAuth2), and `auth.props.<field>` (CustomAuth) are all correctly typed — read them directly. Never write `auth as { secret_text: string }` or any cast; it's redundant and the repo bans casts. (Real no-cast examples: `airtable`, `baremetrics`, `todoist` common files.)

```typescript
function projectId<R extends boolean>({ required, displayName = 'Project', description = 'The project to use.' }: PropParams<R>) {
  return Property.Dropdown({
    auth: myAppAuth,
    displayName,
    description,
    required,
    refreshers: [],  // Array of prop keys this depends on
    options: async ({ auth }) => {
      if (!auth) {
        return disabledOptions({ placeholder: 'Please connect your account first.' });
      }
      const projects = await myAppApi.listProjects({ auth });
      return {
        disabled: false,
        options: projects.map((project) => ({ label: project.name, value: project.id })),
      };
    },
  });
}
```

## Dependent Dropdown (refreshes when parent changes)

```typescript
function taskId<R extends boolean>({ required, displayName = 'Task', description = 'A task in the selected project.' }: PropParams<R>) {
  return Property.Dropdown({
    auth: myAppAuth,
    displayName,
    description,
    required,
    refreshers: ['projectId'],  // Re-fetches when the 'projectId' prop changes
    options: async ({ auth, projectId }) => {
      if (!auth) {
        return disabledOptions({ placeholder: 'Please connect your account first.' });
      }
      if (!projectId) {
        return disabledOptions({ placeholder: 'Please select a project first.' });
      }
      const tasks = await myAppApi.listTasks({ auth, projectId });
      return {
        disabled: false,
        options: tasks.map((task) => ({ label: task.title, value: task.id })),
      };
    },
  });
}
```

**Empty states:** every disabled return goes through `disabledOptions({ placeholder })`, a private helper in `props.ts` that returns `{ disabled: true, options: [], placeholder }`. Its definition is in `piece-layout.md`.

`refreshers` names a prop key, which makes it a contract. Every action that uses `myAppProps.taskId` must name its parent prop `projectId`. Following "key equals factory name" keeps that true, so don't make `refreshers` a factory parameter.

## Multi-Select Dropdown (dynamic)

```typescript
function labelIds<R extends boolean>({ required, displayName = 'Labels', description }: PropParams<R>) {
  return Property.MultiSelectDropdown({
    auth: myAppAuth,
    displayName,
    description,
    required,
    refreshers: ['projectId'],
    options: async ({ auth, projectId }) => {
      // Same pattern as Dropdown, returns multiple selected values
    },
  });
}
```

## Dynamic Properties (fields determined at runtime)

For forms where the fields themselves come from the API (e.g., custom table columns):

```typescript
function recordFields<R extends boolean>({ required, displayName = 'Record Fields', description }: PropParams<R>) {
  return Property.DynamicProperties({
    auth: myAppAuth,
    displayName,
    description,
    required,
    refreshers: ['tableId'],
    props: async ({ auth, tableId }): Promise<DynamicPropsValue> => {
      if (!auth || !tableId) return {};
      const fields = await myAppApi.listTableFields({ auth, tableId });
      return Object.fromEntries(
        fields.map((field) => [field.id, Property.ShortText({ displayName: field.name, required: field.required })]),
      );
    },
  });
}
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

For the `PieceCategory` values used in `createPiece({ categories: [...] })`, see `piece-types.md` — it lists every category with guidance on which to pick. (Categories aren't a prop type, so they live there rather than here.)
