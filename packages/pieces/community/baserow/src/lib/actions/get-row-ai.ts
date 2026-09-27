import { createAction } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { makeClient } from '../common';
import { baserowAiProps } from '../common/ai-props';
import { baserowAiHelpers } from '../common/ai-helpers';
import { rowOutputSchema } from '../output-schemas';

export const getRowAiAction = createAction({
  name: 'baserow_get_row_ai',
  classification: 'READ',
  outputSchema: rowOutputSchema,
  displayName: 'Get Row',
  description: 'Gets a single row by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches one row and all its field values (keyed by field name) from a Baserow table by numeric row ID. Use when the row ID is known; to locate a row by a field value use Find Row. Read-only and idempotent.',
    idempotent: true,
  },
  auth: baserowAuth,
  props: {
    table_id: baserowAiProps.tableIdProp(),
    row_id: baserowAiProps.rowIdProp(),
  },
  async run(context) {
    const { table_id, row_id } = context.propsValue;
    const client = await makeClient(context.auth);
    return await baserowAiHelpers.execute(() => client.getRow(table_id, row_id));
  },
});
