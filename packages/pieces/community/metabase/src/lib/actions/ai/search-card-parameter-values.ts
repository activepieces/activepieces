import { createAction, Property } from '@activepieces/pieces-framework';

import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseSearchCardParameterValuesOutputSchema } from '../../output-schemas';

export const searchCardParameterValuesAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_search_card_parameter_values',
  outputSchema: metabaseSearchCardParameterValuesOutputSchema,
  displayName: 'Search Card Parameter Values',
  description: "Search the allowed values of a saved question's filter.",
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      "Returns a question's filter values that match a search text. Use it instead of List Card Parameter Values when the filter has many values.",
    idempotent: true,
  },
  props: {
    cardId: metabaseAiProps.cardId({ required: true }),
    parameterId: metabaseAiProps.parameterId({ required: true }),
    query: Property.ShortText({
      displayName: 'Search Text',
      description: 'Text to match against the filter values.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.searchCardParameterValues({
      auth,
      cardId: propsValue.cardId,
      parameterId: propsValue.parameterId,
      query: propsValue.query,
    });
  },
});
