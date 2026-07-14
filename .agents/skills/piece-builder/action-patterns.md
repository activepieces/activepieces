# Action Patterns

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
  audience: 'both',             // explicit -- see ai-metadata.md
  aiMetadata: {
    description:
      'Create a new record in My App. Use to add a single entry when you already have its field values. Each call creates a new record, so retries duplicate.',
    idempotent: false,
  },
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
        token: context.auth.secret_text,
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

The `token` field above assumes a `PieceAuth.SecretText()` auth. For other auth types, swap to `context.auth.access_token` (OAuth2), `context.auth.username`/`.password` (BasicAuth), or `context.auth.props.<field>` (CustomAuth). See `auth-patterns.md` for the full table.

**Real example:** `packages/pieces/community/github/src/lib/actions/create-issue.ts`

For all available property types (`Property.ShortText`, `Property.Dropdown`, `Property.Array`, etc.) read `props-patterns.md`.

## AI-Ready Metadata (required on new actions)

Every new action ships with an explicit `audience` (`'both'` for normal integration actions, `'human'` for LLM-wrappers/utilities) and `aiMetadata: { description, idempotent }` — the agent-facing description and safe-retry hint. They are additive and change nothing for human users. Writing rules and the `idempotent` derivation table: `ai-metadata.md`.
