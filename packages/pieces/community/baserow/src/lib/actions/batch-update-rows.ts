import { Property, createAction } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { baserowCommon, makeClient } from '../common';

export const batchUpdateRowsAction = createAction({
  name: 'baserow_batch_update_rows',
  displayName: 'Batch Update Rows',
  description:
    'Updates multiple rows in a single request. Each row must include an "id" field. Accepts up to 200 rows.',
  auth: baserowAuth,
  props: {
    table_id: baserowCommon.tableId(),
    rows: Property.Json({
      displayName: 'Rows',
      description:
        'A JSON array of objects. Each object must include an "id" field and the fields to update.',
      required: true,
      defaultValue: [{ id: 1, Name: 'Updated Row 1' }],
    }),
  },
  async run(context) {
    const table_id = context.propsValue.table_id!;
    const rows = context.propsValue.rows;
    if (!Array.isArray(rows)) {
      throw new Error('Rows must be a JSON array.');
    }
    const client = await makeClient(context.auth);
    return await client.batchUpdateRows(
      table_id,
      rows as Record<string, unknown>[]
    );
  },
});
