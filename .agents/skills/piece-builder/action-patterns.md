# Action Patterns

> **AI Metadata is mandatory on every action.** `descriptionForLLM`, `tags`, `difficulty`, `outputSchema`, and property `example` fields must all be populated. See `SKILL.md` → AI Metadata section for the rules.

## Action Template

Each action goes in its own file under `src/lib/actions/`:

```typescript
import { createAction, Property, ActionResult } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { myAppAuth } from '../../';

export const createRecordAction = createAction({
  auth: myAppAuth,
  name: 'create_record',              // Unique snake_case ID -- never change after publishing
  displayName: 'Create Record',
  description: 'Creates a new record in My App',
  // REQUIRED: LLM-optimized description. Template: "<Verb> <what>. Use when <situation>. <Constraints>."
  descriptionForLLM: "Creates a new record in My App. Use when you need to add a new entry (e.g. customer, task, or document) to the user's My App workspace. Requires a name; description is optional.",
  // REQUIRED: one verb tag + one domain tag
  tags: ['write', 'records'],
  // REQUIRED: easy (single call) | medium (multiple calls / lookups) | hard (multi-step with side effects)
  difficulty: 'easy',
  // REQUIRED: JSON Schema of what run() returns -- helps LLMs use downstream fields without hallucinating.
  outputSchema: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Unique ID of the created record' },
      name: { type: 'string', description: 'Name of the record' },
      created_at: { type: 'string', format: 'date-time', description: 'ISO 8601 creation timestamp' },
    },
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of the record. Max 255 characters.',
      example: 'Q1 2026 Product Launch',    // REQUIRED on every property -- realistic sample value
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Optional longer description for the record.',
      example: 'Kickoff meeting notes and action items.',
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

**AI Metadata is mandatory -- do not skip `descriptionForLLM`, `tags`, `difficulty`, `outputSchema`, or property `example` fields.** See `SKILL.md` → AI Metadata section for rules and examples.

**Real example:** `packages/pieces/community/github/src/lib/actions/create-issue.ts`

For all available property types (`Property.ShortText`, `Property.Dropdown`, `Property.Array`, etc.) read `props-patterns.md`.
