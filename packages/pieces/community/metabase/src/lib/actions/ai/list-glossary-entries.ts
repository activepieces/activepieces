import { createAction } from '@activepieces/pieces-framework';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseListGlossaryEntriesOutputSchema } from '../../output-schemas';

export const listGlossaryEntriesAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_list_glossary_entries',
  outputSchema: metabaseListGlossaryEntriesOutputSchema,
  displayName: 'List Glossary Entries',
  description: 'List business glossary terms.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the business glossary: terms and their definitions, with ids.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    return await metabaseApi.listGlossaryEntries({
      auth,
    });
  },
});
