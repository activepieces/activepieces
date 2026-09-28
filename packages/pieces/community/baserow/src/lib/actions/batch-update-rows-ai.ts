import { createAction, Property } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { makeClient } from '../common';
import { baserowAiProps } from '../common/ai-props';
import { baserowAiHelpers } from '../common/ai-helpers';
import { batchRowsOutputSchema } from '../output-schemas';

export const batchUpdateRowsAiAction = createAction({
  name: 'baserow_batch_update_rows_ai',
  classification: 'WRITE',
  outputSchema: batchRowsOutputSchema,
  displayName: 'Batch Update Rows',
  description: 'Updates up to 200 rows in one request.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates up to 200 existing Baserow rows in one request; each object needs the row "id" plus only the fields to change, and omitted fields are left as they are. Use for bulk edits instead of repeated Update Row calls. Idempotent — repeating the same values converges on the same state.',
    idempotent: true,
  },
  auth: baserowAuth,
  props: {
    table_id: baserowAiProps.tableIdProp(),
    rows: Property.Json({
      displayName: 'Rows',
      description:
        'JSON array of objects, each with the numeric row "id" and the field names to change, e.g. [{"id": 1, "Status": "Done"}]. Maximum 200.',
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
    const missingId = items.findIndex((item) => !Number.isInteger(Number(item['id'])));
    if (missingId !== -1) {
      throw new Error(`Rows[${missingId}] is missing a numeric "id".`);
    }
    const client = await makeClient(context.auth);
    const response = await baserowAiHelpers.execute(() => client.batchUpdateRows(table_id, items));
    return { count: response.items.length, rows: response.items };
  },
});
