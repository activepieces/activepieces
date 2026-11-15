import { createAction, Property } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { makeClient } from '../common';
import { baserowAiProps } from '../common/ai-props';
import { baserowAiHelpers } from '../common/ai-helpers';
import { getFieldUniqueValuesOutputSchema } from '../output-schemas';

export const getFieldUniqueValuesAction = createAction({
  name: 'baserow_get_field_unique_values',
  classification: 'READ',
  outputSchema: getFieldUniqueValuesOutputSchema,
  displayName: 'Get Field Unique Values',
  description: 'Lists the distinct values stored in a field.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the distinct values stored in a Baserow field, most frequent first. Use to discover valid values before filtering rows or to profile a column without paging through rows. Requires an Email & Password connection. Read-only and idempotent.',
    idempotent: true,
  },
  auth: baserowAuth,
  props: {
    field_id: baserowAiProps.fieldIdProp(),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of values to return. Defaults to 10.',
      required: false,
    }),
    split_comma_separated: Property.Checkbox({
      displayName: 'Split Comma-Separated Values',
      description: 'Treat "a,b" as two values a and b.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { field_id, limit, split_comma_separated } = context.propsValue;
    baserowAiHelpers.assertJwt({ auth: context.auth, actionName: 'Get Field Unique Values' });
    const client = await makeClient(context.auth);
    const response = await baserowAiHelpers.execute(() =>
      client.getFieldUniqueValues({
        fieldId: field_id,
        limit: limit ?? undefined,
        splitCommaSeparated: split_comma_separated,
      })
    );
    return { count: response.values.length, values: response.values };
  },
});
