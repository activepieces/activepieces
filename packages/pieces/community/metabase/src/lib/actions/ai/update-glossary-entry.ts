import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseCreateGlossaryEntryOutputSchema } from '../../output-schemas';

export const updateGlossaryEntryAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_update_glossary_entry',
  outputSchema: metabaseCreateGlossaryEntryOutputSchema,
  displayName: 'Update Glossary Entry',
  description: 'Replace a glossary term and its definition.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Sets a glossary entry's term and definition; both are required because Metabase replaces the entry.",
    idempotent: true,
  },
  props: {
    glossaryId: metabaseAiProps.glossaryId({ required: true }),
    term: Property.ShortText({
      displayName: 'Term',
      required: true,
    }),
    definition: Property.LongText({
      displayName: 'Definition',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.updateGlossaryEntry({
      auth,
      glossaryId: propsValue.glossaryId,
      body: { term: propsValue.term, definition: propsValue.definition },
    });
  },
});
