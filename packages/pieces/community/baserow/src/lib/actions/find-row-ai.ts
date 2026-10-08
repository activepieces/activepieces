import { createAction, Property } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { makeClient } from '../common';
import { baserowAiProps } from '../common/ai-props';
import { baserowAiHelpers } from '../common/ai-helpers';
import { findRowAiOutputSchema } from '../output-schemas';

export const findRowAiAction = createAction({
  name: 'baserow_find_row_ai',
  classification: 'SEARCH',
  outputSchema: findRowAiOutputSchema,
  displayName: 'Find Row',
  description: 'Finds the first row whose field equals a value.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the first row in a Baserow table whose named field exactly equals a value, plus the total match count. Use to resolve a row ID from a known key such as an email or external ID; for partial-text or multi-condition queries use List Rows. Read-only and idempotent.',
    idempotent: true,
  },
  auth: baserowAuth,
  props: {
    table_id: baserowAiProps.tableIdProp(),
    field_name: Property.ShortText({
      displayName: 'Field Name',
      description: 'Exact name of the field to match on. Resolve with Get Table Fields.',
      required: true,
    }),
    value: Property.ShortText({
      displayName: 'Value',
      description: 'The value the field must equal.',
      required: true,
    }),
  },
  async run(context) {
    const { table_id, field_name, value } = context.propsValue;
    const client = await makeClient(context.auth);
    const response = await baserowAiHelpers.execute(async () => {
      const field = await baserowAiHelpers.resolveField({
        client,
        tableId: table_id,
        fieldName: field_name,
      });
      return await client.queryRows({
        tableId: table_id,
        query: { size: '1', [`filter__field_${field.id}__equal`]: value },
      });
    });
    const row = response.results[0] ?? null;
    return { found: row !== null, count: response.count, row };
  },
});
