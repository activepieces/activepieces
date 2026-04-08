import { Property, createAction } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { baserowCommon, makeClient } from '../common';

export const batchCreateRowsAction = createAction({
  name: 'baserow_batch_create_rows',
  displayName: 'Batch Create Rows',
  description:
    'Creates multiple rows in a single request. Accepts up to 200 rows.',
  auth: baserowAuth,
  props: {
    table_id: baserowCommon.tableId(),
    rows: Property.Json({
      displayName: 'Rows',
      description:
        'A JSON array of objects. Each object represents a row with field names as keys.',
      required: true,
      defaultValue: [{ Name: 'Row 1' }, { Name: 'Row 2' }],
    }),
  },
  async run(context) {
    const table_id = context.propsValue.table_id!;
    const rows = context.propsValue.rows;
    if (!Array.isArray(rows)) {
      throw new Error('Rows must be a JSON array.');
    }
    const client = await makeClient(context.auth);
    return await client.batchCreateRows(
      table_id,
      rows as Record<string, unknown>[]
    );
  },
});
