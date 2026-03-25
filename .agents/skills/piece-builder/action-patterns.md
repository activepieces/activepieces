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

For all available property types (`Property.ShortText`, `Property.Dropdown`, `Property.Array`, etc.) read `props-patterns.md`.
