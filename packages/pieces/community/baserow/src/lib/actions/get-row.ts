import { createAction } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { baserowCommon, makeClient } from '../common';

export const getRowAction = createAction({
  name: 'baserow_get_row',
  displayName: 'Get Row',
  description: 'Gets a single row by its ID from a table.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches one row from a Baserow table by its numeric row ID. Use when you already know the exact row ID and want its full current field values; to locate a row by a field value instead, use Find Row. Read-only and idempotent.',
    idempotent: true,
  },
  auth: baserowAuth,
  props: {
    table_id: baserowCommon.tableId(),
    row_id: baserowCommon.rowId(),
  },
  async run(context) {
    const { table_id, row_id } = context.propsValue as {table_id: number, row_id: number};
    const client = await makeClient(context.auth);
    return await client.getRow(table_id, row_id);
  },
});
