import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseCreateSnippetOutputSchema } from '../../output-schemas';

export const createSnippetAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_create_snippet',
  outputSchema: metabaseCreateSnippetOutputSchema,
  displayName: 'Create Snippet',
  description: 'Create a reusable SQL snippet.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a reusable SQL snippet that SQL questions can include as {{snippet: Name}}. Names must be unique; a duplicate name fails.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Unique snippet name, used as {{snippet: Name}} in SQL.',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'SQL',
      description: 'The SQL fragment.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.createSnippet({
      auth,
      body: {
        name: propsValue.name,
        content: propsValue.content,
        description: propsValue.description,
      },
    });
  },
});
