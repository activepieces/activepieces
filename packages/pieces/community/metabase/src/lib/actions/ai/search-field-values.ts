import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseSearchFieldValuesOutputSchema } from '../../output-schemas';

export const searchFieldValuesAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_search_field_values',
  outputSchema: metabaseSearchFieldValuesOutputSchema,
  displayName: 'Search Field Values',
  description: 'Search the values of a field.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns values of a field that match a search text, e.g. to find a customer name for a filter. Optionally search a different field (such as a name column) linked to it.',
    idempotent: true,
  },
  props: {
    fieldId: metabaseAiProps.fieldId({ required: true }),
    value: Property.ShortText({
      displayName: 'Search Text',
      description: 'Text to match.',
      required: true,
    }),
    searchFieldId: Property.Number({
      displayName: 'Search Field ID',
      description:
        'Field whose values are matched, e.g. a name column linked to an ID field. Empty = the same field.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.searchFieldValues({
      auth,
      fieldId: propsValue.fieldId,
      searchFieldId: propsValue.searchFieldId ?? propsValue.fieldId,
      value: propsValue.value,
    });
  },
});
