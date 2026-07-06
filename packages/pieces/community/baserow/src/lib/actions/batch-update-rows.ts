import { Property, createAction } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { baserowCommon, makeClient } from '../common';

export const batchUpdateRowsAction = createAction({
  name: 'baserow_batch_update_rows',
  displayName: 'Batch Update Rows',
  description:
    'Updates multiple rows in a single request. Each row must include an "id" field. Accepts up to 200 rows.',
  audience: 'both',
  aiMetadata: {
    description:
      'Updates many existing Baserow rows in one request from a JSON array, up to 200 rows per call. Every object must carry an "id" identifying the row plus the fields to change. Use for bulk edits to known rows instead of repeated Update Row calls. Idempotent: re-sending the same id/field values converges those rows to the same state.',
    idempotent: true,
  },
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
    const response = await client.batchUpdateRows(table_id, rows);
    return { count: response.items.length, rows: response.items };
  },
});
