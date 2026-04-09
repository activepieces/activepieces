import { Property, createAction } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { baserowCommon, makeClient } from '../common';

export const batchDeleteRowsAction = createAction({
  name: 'baserow_batch_delete_rows',
  displayName: 'Batch Delete Rows',
  description:
    'Deletes multiple rows in a single request. Accepts up to 200 row IDs.',
  auth: baserowAuth,
  props: {
    table_id: baserowCommon.tableId(),
    row_ids: Property.Array({
      displayName: 'Row IDs',
      description: 'List of row IDs to delete.',
      required: true,
    }),
  },
  async run(context) {
    const table_id = context.propsValue.table_id!;
    const row_ids = context.propsValue.row_ids;
    if (!Array.isArray(row_ids) || row_ids.length === 0) {
      throw new Error('Row IDs must be a non-empty array.');
    }
    const ids = row_ids
      .map((id) => parseInt(String(id), 10))
      .filter((id) => !isNaN(id));
    const client = await makeClient(context.auth);
    return await client.batchDeleteRows(table_id, ids);
  },
});
