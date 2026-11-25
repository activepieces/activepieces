import { createAction } from '@activepieces/pieces-framework';

import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseSearchCardParameterValuesOutputSchema } from '../../output-schemas';

export const listCardParameterValuesAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_list_card_parameter_values',
  outputSchema: metabaseSearchCardParameterValuesOutputSchema,
  displayName: 'List Card Parameter Values',
  description: "List the allowed values of a saved question's filter.",
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      "Returns the values a question's filter offers, so you can pass a valid value to Run Card Query. Use Search Card Parameter Values when the list is long.",
    idempotent: true,
  },
  props: {
    cardId: metabaseAiProps.cardId({ required: true }),
    parameterId: metabaseAiProps.parameterId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.listCardParameterValues({
      auth,
      cardId: propsValue.cardId,
      parameterId: propsValue.parameterId,
    });
  },
});
