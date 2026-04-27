# Action Patterns

> **AI Metadata is mandatory on every action.** The `infoForLLM` bundle (just `description` today) must be populated, and every input property must carry a meaningful `description` with an example baked in where useful. See `SKILL.md` → AI Metadata section for the rules.

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
  // REQUIRED: AI metadata bundle read by LLM/MCP agents.
  infoForLLM: {
    // Template: "<Verb> <what>. Use when <situation>. <Constraints>."
    description: "Creates a new record in My App. Use when you need to add a new entry (e.g. customer, task, or document) to the user's My App workspace. Requires a name; description is optional.",
  },
  props: {
    // Every prop needs a description; embed an example in the prose where it
    // clarifies the expected format (IDs, dates, enums, URLs, etc.).
    name: Property.ShortText({
      displayName: 'Name',
      description: "Name of the record. Max 255 characters. Example: 'Q1 2026 Product Launch'.",
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: "Optional longer description for the record. Markdown supported. Example: 'Kickoff meeting notes and action items.'",
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

**AI Metadata is mandatory -- do not skip `infoForLLM.description`, and never leave a property without a `description`.** Embed example values in prop descriptions whenever a sample value clarifies the format. See `SKILL.md` → AI Metadata section for rules and examples.

**Real example:** `packages/pieces/community/github/src/lib/actions/create-issue.ts`

For all available property types (`Property.ShortText`, `Property.Dropdown`, `Property.Array`, etc.) read `props-patterns.md`.
