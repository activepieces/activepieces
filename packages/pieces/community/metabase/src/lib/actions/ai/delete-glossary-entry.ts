import { createAction } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseDeleteGlossaryEntryOutputSchema } from '../../output-schemas';

export const deleteGlossaryEntryAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_delete_glossary_entry',
  outputSchema: metabaseDeleteGlossaryEntryOutputSchema,
  displayName: 'Delete Glossary Entry',
  description: 'Delete a glossary term.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Permanently deletes a glossary entry.',
    idempotent: false,
  },
  props: {
    glossaryId: metabaseAiProps.glossaryId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await metabaseApi.deleteGlossaryEntry({
      auth,
      glossaryId: propsValue.glossaryId,
    });
    return { deleted: true, glossaryId: propsValue.glossaryId };
  },
});
