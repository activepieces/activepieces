import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseListSnippetsOutputSchema } from '../../output-schemas';

export const listSnippetsAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_list_snippets',
  outputSchema: metabaseListSnippetsOutputSchema,
  displayName: 'List Snippets',
  description: 'List reusable SQL snippets.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists reusable SQL snippets (referenced in SQL as {{snippet: Name}}) with their ids and content.',
    idempotent: true,
  },
  props: {
    archived: Property.Checkbox({
      displayName: 'Archived',
      description: 'Return archived snippets instead of active ones.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const snippets = await metabaseApi.listSnippets({
      auth,
      archived: propsValue.archived ?? false,
    });
    return { snippets, count: snippets.length };
  },
});
