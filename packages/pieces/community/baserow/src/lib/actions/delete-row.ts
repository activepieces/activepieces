import { createAction } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { baserowCommon, makeClient } from '../common';

export const deleteRowAction = createAction({
  name: 'baserow_delete_row',
  displayName: 'Delete Row',
  description: 'Deletes an existing row.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes one row from a Baserow table by its numeric row ID. Use to remove a single known record; for multiple rows use Batch Delete Rows. Destructive — confirm the row ID first (resolve via Find Row or List Rows if unknown). Not idempotent against changing data: once the row is gone a repeat call targets a no-longer-existing ID.',
    idempotent: false,
  },
  auth: baserowAuth,
  props: {
    table_id: baserowCommon.tableId(),
    row_id: baserowCommon.rowId(),
  },
  async run(context) {
    const { table_id, row_id } = context.propsValue as { table_id: number; row_id: number };
    const client = await makeClient(context.auth);
    await client.deleteRow(table_id, row_id);
    return { success: true };
  },
});
