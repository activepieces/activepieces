import { createAction } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { baserowCommon, makeClient } from '../common';

export const deleteRowAction = createAction({
  name: 'baserow_delete_row',
  displayName: 'Delete Row',
  description: 'Deletes an existing row.',
  auth: baserowAuth,
  props: {
    table_id: baserowCommon.tableId(),
    row_id: baserowCommon.rowId(),
  },
  async run(context) {
    const { table_id, row_id } = context.propsValue as { table_id: number; row_id: number };
    const client = await makeClient(context.auth);
    return await client.deleteRow(table_id, row_id);
  },
});
