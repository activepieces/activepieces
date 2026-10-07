import { createAction, Property } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { makeClient } from '../common';
import { baserowAiProps } from '../common/ai-props';
import { baserowAiHelpers } from '../common/ai-helpers';
import { batchDeleteRowsAiOutputSchema } from '../output-schemas';

export const batchDeleteRowsAiAction = createAction({
  name: 'baserow_batch_delete_rows_ai',
  classification: 'DESTRUCTIVE',
  outputSchema: batchDeleteRowsAiOutputSchema,
  displayName: 'Batch Delete Rows',
  description: 'Deletes up to 200 rows in one request.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Deletes up to 200 rows from a Baserow table by row ID in one request; the rows move to the Baserow trash and can be restored there. Use instead of repeated Delete Row calls. Does not fire row-deleted webhooks. Not idempotent — a repeat call fails for IDs that are already gone.',
    idempotent: false,
  },
  auth: baserowAuth,
  props: {
    table_id: baserowAiProps.tableIdProp(),
    row_ids: Property.Array({
      displayName: 'Row IDs',
      description: 'Numeric IDs of the rows to delete. Maximum 200.',
      required: true,
    }),
  },
  async run(context) {
    const { table_id, row_ids } = context.propsValue;
    const ids = baserowAiHelpers.toIdArray({
      value: row_ids,
      propName: 'Row IDs',
      max: baserowAiHelpers.BATCH_LIMIT,
    });
    const client = await makeClient(context.auth);
    await baserowAiHelpers.execute(() => client.batchDeleteRows(table_id, ids));
    return { deleted: true, count: ids.length, row_ids: ids };
  },
});
