import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseCreateGlossaryEntryOutputSchema } from '../../output-schemas';

export const createGlossaryEntryAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_create_glossary_entry',
  outputSchema: metabaseCreateGlossaryEntryOutputSchema,
  displayName: 'Create Glossary Entry',
  description: 'Add a term to the business glossary.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds a term and its definition to the business glossary. Each call creates a new entry.',
    idempotent: false,
  },
  props: {
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
    return await metabaseApi.createGlossaryEntry({
      auth,
      body: { term: propsValue.term, definition: propsValue.definition },
    });
  },
});
