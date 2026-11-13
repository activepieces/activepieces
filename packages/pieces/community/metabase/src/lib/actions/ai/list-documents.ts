import { createAction } from '@activepieces/pieces-framework';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseListDocumentsOutputSchema } from '../../output-schemas';

export const listDocumentsAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_list_documents',
  outputSchema: metabaseListDocumentsOutputSchema,
  displayName: 'List Documents',
  description: 'List documents.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists Metabase documents (rich-text reports that can embed questions) with their ids and collections.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    return await metabaseApi.listDocuments({
      auth,
    });
  },
});
