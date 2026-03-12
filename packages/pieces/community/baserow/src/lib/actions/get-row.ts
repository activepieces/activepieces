import { createAction } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { baserowCommon, makeClient } from '../common';

export const getRowAction = createAction({
  name: 'baserow_get_row',
  displayName: 'Get Row',
  description: 'Fetches a single table row.',
  auth: baserowAuth,
  props: {
    table_id: baserowCommon.tableId(),
    row_id: baserowCommon.rowId(),
  },
  async run(context) {
    const { table_id, row_id } = context.propsValue;
    const client = makeClient(
      context.auth.props
    );
    return await client.getRow(table_id, row_id);
  },
});
