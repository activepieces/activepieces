# Action Patterns

## Action Template

Each action goes in its own file under `src/lib/actions/`, named `<verb>-<noun>.ts` with no `.action.ts` suffix. AI actions go under `src/lib/actions/ai/`.

The action never calls `httpClient` or the vendor SDK. It reads props, calls `myAppApi`, and shapes the output. The endpoint itself lives in `common/api.ts`; see `piece-layout.md`.

```typescript
import { createAction, Property } from '@activepieces/pieces-framework';
import { myAppAuth } from '../auth';
import { myAppApi } from '../common/api';
import { myAppProps } from '../common/props';

export const createTaskAction = createAction({
  auth: myAppAuth,
  name: 'create_task',          // Unique snake_case ID -- never change after publishing
  displayName: 'Create Task',
  description: 'Creates a new task in a project.',
  audience: 'both',             // explicit -- see ai-metadata.md
  aiMetadata: {
    description:
      'Create a new task in a My App project. Use to add a single task when you already know its title. Each call creates a new task, so retries duplicate.',
    idempotent: false,
  },
  classification: 'WRITE',
  props: {
    projectId: myAppProps.projectId({ required: true }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Task title. Max 255 characters.',
      required: true,
    }),
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return await myAppApi.createTask({
      auth,
      projectId: propsValue.projectId,
      title: propsValue.title,
      dueDate: toDateOnly({ value: propsValue.dueDate }),
    });
  },
});

function toDateOnly({ value }: { value: string | undefined }): string | undefined {
  return value ? value.slice(0, 10) : undefined;
}
```

- **Props:**
  - API-backed dropdowns come from `myAppProps` and are factories with `{ required }`.
  - Plain one-off props (`ShortText`, `DateTime`, ...) stay inline.
  - The key equals the factory name (`projectId: myAppProps.projectId(...)`).
- **Helpers:** a helper only this action uses is a private `function` below the export. It takes plain values, not the whole `propsValue`. Once a second file needs it, move it to `common/utils.ts`.
- **Auth:** `auth` from `run` passes straight to `myAppApi`, with no unpacking in the action. The auth-type differences (`secret_text`, `access_token`, `props.<field>`) are handled once, in `client.ts`.

For all available property types (`Property.ShortText`, `Property.Dropdown`, `Property.Array`, etc.) read `props-patterns.md`.

## AI-Ready Metadata (required on new actions)

Every new action ships with an explicit `audience` (`'both'` for normal integration actions, `'human'` for LLM-wrappers/utilities) and `aiMetadata: { description, idempotent }` — the agent-facing description and safe-retry hint. They are additive and change nothing for human users. Writing rules and the `idempotent` derivation table: `ai-metadata.md`.
