# Schema Reference

The authoritative type lives in `packages/pieces/framework/src/lib/output-schema.ts` and is re-exported from `@activepieces/pieces-framework`.

```ts
export type OutputSchema = {
  fields: OutputSchemaField[];
  itemLabel?: string; // only for top-level ARRAY output; template with {dotPath} placeholders
};

export type OutputSchemaField = {
  key: string;              // stable identifier for this field
  label?: string;           // human label shown in the UI (Title Case)
  value?: string;           // path to the value — see "The relative-path rule"
  format?: FieldFormat;     // rendering hint (see formats table)
  description?: string;     // optional; helps AI/MCP consumers
  dynamicKey?: boolean;     // this field's value is a map with opaque/variable keys
  labelKey?: string;        // for listItems/dynamicKey: which inner field labels each entry
  currency?: string;        // with format: 'currency'
  children?: OutputSchemaField[];  // describe an OBJECT value's fields (relative paths)
  listItems?: OutputSchemaField[]; // describe ARRAY items' fields (relative paths)
};

type FieldFormat =
  | 'email' | 'url' | 'date' | 'datetime' | 'number' | 'boolean'
  | 'image' | 'html' | 'currency' | 'filesize' | 'duration';
```

## <a id="key-vs-value"></a>`key` vs `value`

Every field has a required `key` and an optional `value` (the path). **When `value` is omitted, the path IS `key`** (the renderer resolves `field.value ?? field.key`). So:

- **Plain field:** set `key` to the real JSON property name and **omit `value`** — the dominant shipped style (e.g. google-calendar's `eventOutputSchema` fields are all `{ key, label }`, no `value`).
- **Set `value`** only when the path must differ from the `key` you want to show: to **unwrap** (`value: 'body'`, `value: 'data.documentId'`) or to give a field a cleaner `key`/label than its raw property name.
- **Caveat for AI/MCP consumers:** the builder resolves `value ?? key`, but the AI/MCP path map (`flattenOutputSchemaFields` in `packages/server/api/src/app/mcp/tools/mcp-utils.ts`) is built from **`key` only** — it ignores `value`. A field like `{ key: 'startDateTime', value: 'start.dateTime' }` inserts the correct path in the builder yet exports the wrong one to agents. Keep `key` equal to the real leaf property name wherever that matters, and reserve `key != value` for genuine unwrapping.

## The relative-path rule (most important)

- **Top-level fields** in `schema.fields` resolve their `value` against the **output root**.
- **`children` fields** resolve their `value` against the **parent field's resolved object** — relative, one level down.
- **`listItems` fields** resolve their `value` against **one item** of the parent array — relative.

Given `run()` returns `{ id, owners: [{ displayName, emailAddress }], lastModifyingUser: { displayName } }`:

```ts
// CORRECT — child/item paths are RELATIVE to their parent (path = value ?? key)
{
  fields: [
    { key: 'id', label: 'ID' },                              // path = 'id' (root)
    {
      key: 'owners', label: 'Owners', labelKey: 'displayName',
      listItems: [                                            // each resolved against ONE owner
        { key: 'displayName', label: 'Name' },
        { key: 'emailAddress', label: 'Email', format: 'email' },
      ],
    },
    {
      key: 'lastModifyingUser', label: 'Last Modifying User',
      children: [                                             // resolved against the object
        { key: 'displayName', label: 'Name' },
      ],
    },
  ],
}
```

Common mistake: setting a child path of `owners.displayName` (as `value` or `key`). It resolves against the owner item *again* → `owners.displayName` on one owner → undefined. Keep the child path just `displayName`.

> If you ever paste schema from a generator that emits **absolute** child paths (`data.owners.displayName`), normalize them to relative before writing.

## Top-level ARRAY output

When `run()` returns an array (list/search/find), wrap it in **one field with `value: ''`** (the whole array) whose `listItems` describe each item, and set a schema-level **`itemLabel`** template:

```ts
export const findRowsActionOutputSchema: OutputSchema = {
  itemLabel: 'Row {row}',
  fields: [
    {
      key: 'rows', label: 'Found Rows', value: '',
      listItems: [
        { key: 'row', label: 'Row Number', value: 'row' },
        { key: 'values', label: 'Values', value: 'values', dynamicKey: true },
      ],
    },
  ],
};
```

> **AI/MCP caveat — root-array wrappers export a phantom path.** The builder resolves the `value: ''` wrapper correctly (whole array), but the AI/MCP path map (`flattenOutputSchemaFields` in `mcp/tools/mcp-utils.ts`) builds paths from **`key`** and ignores `value: ''`, so it emits paths under the wrapper key — e.g. `rows[].row` — while the real output is the array itself (there is no `rows` property). Those exported paths resolve to `undefined` for AI/MCP consumers. This is a limitation of the flattener, not something the schema can express around (the builder only accepts this one shape for root arrays). Until the flattener learns to drop the wrapper key when `value === ''`, treat the AI/MCP paths for **root-array actions** as unreliable; the builder/data-selector view is unaffected. (Give the wrapper a descriptive `key` anyway — it becomes the human label.)

## Maps with opaque / variable keys → `dynamicKey`

When an object's keys are *data* (calendar ids, column letters, user ids) rather than a fixed schema, mark the field `dynamicKey: true`. In the builder, each entry is **drilled generically** from the sample and labelled by `labelKey`; the entry's own `children`/`listItems` are **not rendered** in the data selector or output viewer. (They *are* still walked by the AI/MCP path map, so include them only when that path map matters — otherwise `labelKey` plus the field's `label`/`format` is all that has an effect.) The inserted expression path always uses the opaque key; `labelKey` only changes the displayed label.

```ts
// freeBusy: { calendars: { "<calendarId>": { busy: [{ start, end }] } } }
{
  key: 'calendars', label: 'Calendars', dynamicKey: true,
  // children below do NOT render in the builder (each calendar entry drills
  // generically); they only enrich the AI/MCP path map. Drop them if you don't
  // need that. labelKey on `busy` labels each period by its start time.
  children: [
    {
      key: 'busy', label: 'Busy Periods', labelKey: 'start',
      listItems: [
        { key: 'start', label: 'Start', format: 'datetime' },
        { key: 'end', label: 'End', format: 'datetime' },
      ],
    },
  ],
}
```

## `labelKey` and `itemLabel`

- **`labelKey`** — on a `listItems` or `dynamicKey` field, names the inner field whose value labels each item/entry (people by `displayName`, messages by `subject`, rows by title, statuses by `status`). Falls back to `Item N` / the raw key. The inserted path is unaffected.
- **`itemLabel`** — schema-level, only for **top-level array** output. Template with `{dotPath}` placeholders resolved against each item (`'Row {row}'`, `'{key}: {summary}'`). Falls back to `Item N`.

## Formats

Apply a `format` wherever the value's meaning fits one. Observed usage across the shipped pieces, most→least common:

| format | use for |
|---|---|
| `boolean` | true/false flags (`trashed`, `shared`, `starred`) |
| `datetime` | ISO timestamps, epoch millis |
| `number` | numeric values / counts |
| `url` | links (`webViewLink`, `htmlLink`) |
| `email` | email addresses |
| `image` | image/thumbnail/icon URLs |
| `filesize` | byte sizes (`size`) |
| `date` | date-only values |
| `html` | HTML body content |
| `duration` | elapsed time |
| `currency` | monetary amounts — pair with `currency: 'USD'` |

## Shared field-sets

Factor a repeated object shape into a `const` typed `OutputSchema['fields']` and reference it everywhere it recurs — from other schemas' `children`/`listItems` and from actions and triggers alike. This keeps a piece's schemas consistent and small.

```ts
const driveFileFields: OutputSchema['fields'] = [
  { key: 'id', label: 'File ID' },
  { key: 'name', label: 'Name' },
  { key: 'webViewLink', label: 'Web View Link', format: 'url' },
  // ...
];

export const findDocumentActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    { key: 'file', label: 'File', children: driveFileFields },
  ],
};
export const newDocumentTriggerOutputSchema: OutputSchema = { fields: driveFileFields };
```

(Some shipped files set `value` explicitly on every field, e.g. `value: 'id'`; that's equivalent — `value` defaults to `key` — just more verbose. Match the file you're editing.)

## Wiring

### Actions — inline `outputSchema:` on the `createAction` object
```ts
import { readDocumentActionOutputSchema } from '../output-schemas';

export const readDocument = createAction({
  name: 'read_document',
  // ...props...
  outputSchema: readDocumentActionOutputSchema,
  async run(context) { /* ... */ },
});
```

### Triggers — inline `outputSchema:` on `createTrigger`
```ts
outputSchema: eventOutputSchema,
type: TriggerStrategy.WEBHOOK,
```

### Triggers built by a shared factory — name-keyed map
Some pieces build many triggers through one factory (e.g. ClickUp's `clickupRegisterTrigger`). Instead of editing each call, export a map keyed by the short trigger name and index into it in the factory:

```ts
// output-schemas.ts
export const clickupTriggerOutputSchemas: Record<string, OutputSchema> = {
  task_created: taskEventTriggerOutputSchema,
  task_deleted: taskHistoryTriggerOutputSchema,
  // ...one entry per trigger name...
};

// register-trigger.ts
outputSchema: clickupTriggerOutputSchemas[name],
```

## File & style conventions

- File location: `packages/pieces/community/<piece>/src/lib/output-schemas.ts`.
- Import path from a step file: match the file's depth. Actions/triggers one level under `lib/` (`lib/actions/x.ts`) import `../output-schemas`; deeper folders (`lib/actions/tasks/x.ts`) use `../../output-schemas`. Watch **multi-line import blocks** — insert the new import after the `} from '...';` that closes the block, never inside it.
- Write clean TypeScript object literals (unquoted keys, single quotes), consistent with `google-docs`'s file. Some shipped files are generator-emitted JSON style (quoted keys) — when editing one of those, match its existing style rather than mixing.
- Order within `output-schemas.ts`: imports, then the **non-exported shared field-set `const`s**, then the **exported schema `const`s** that reference them. The exports must come *after* the field-sets they consume (JS declaration order — a schema const referencing a field-set declared below it throws at module load), which is exactly how the shipped files are laid out (e.g. `google-docs`'s `driveFileFields` precedes the exported schemas). Type shared field-sets as `OutputSchema['fields']`.
- **Version bump:** bump the **patch** version in each touched piece's `package.json`. This is also what forces cloud/self-hosted registries to re-ingest fresh metadata.
