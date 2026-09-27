import { createAction, Property } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { makeClient } from '../common';
import { baserowAiProps } from '../common/ai-props';
import { baserowAiHelpers } from '../common/ai-helpers';
import { batchRowsOutputSchema } from '../output-schemas';

export const batchCreateRowsAiAction = createAction({
  name: 'baserow_batch_create_rows_ai',
  classification: 'WRITE',
  outputSchema: batchRowsOutputSchema,
  displayName: 'Batch Create Rows',
  description: 'Creates up to 200 rows in one request.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates up to 200 new rows in a Baserow table in a single request from a JSON array of field-name-to-value objects. Use for bulk inserts instead of repeated Create Row calls; split larger sets into chunks of 200. Not idempotent — re-running appends the rows again.',
    idempotent: false,
  },
  auth: baserowAuth,
  props: {
    table_id: baserowAiProps.tableIdProp(),
    rows: Property.Json({
      displayName: 'Rows',
      description:
        'JSON array of row objects keyed by field name, e.g. [{"Name": "A"}, {"Name": "B"}]. Maximum 200. Value formats match Create Row.',
      required: true,
    }),
  },
  async run(context) {
    const { table_id, rows } = context.propsValue;
    const items = baserowAiHelpers.toRecordArray({
      value: rows,
      propName: 'Rows',
      max: baserowAiHelpers.BATCH_LIMIT,
    });
    const client = await makeClient(context.auth);
    const response = await baserowAiHelpers.execute(() => client.batchCreateRows(table_id, items));
    return { count: response.items.length, rows: response.items };
  },
});
