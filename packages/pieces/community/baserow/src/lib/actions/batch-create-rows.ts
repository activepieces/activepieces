import { Property, createAction } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { baserowCommon, makeClient } from '../common';
import { batchRowsOutputSchema } from '../output-schemas';

export const batchCreateRowsAction = createAction({
  name: 'baserow_batch_create_rows',
  classification: 'WRITE',
  outputSchema: batchRowsOutputSchema,
  displayName: 'Batch Create Rows',
  description: 'Creates up to 200 rows in one request.',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates many new rows in a Baserow table in one request from a JSON array of row objects (field names as keys), up to 200 rows per call. Use for bulk inserts instead of repeated Create Row calls. Not idempotent — each call appends another set of rows, so it can produce duplicates if re-run.',
    idempotent: false,
  },
  auth: baserowAuth,
  propertyGroups: [
    {
      key: 'table',
      display: 'section',
      label: 'Location',
      icon: 'location',
      props: ['table_id'],
    },
    {
      key: 'rows',
      display: 'section',
      label: 'Rows to Create',
      icon: 'code',
      props: ['rows'],
    },
  ],
  props: {
    table_id: baserowCommon.tableId(),
    rows: Property.Json({
      displayName: 'Rows',
      description: 'A JSON list of rows, up to 200, keyed by column name.',
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
    if (rows.length > 200) {
      throw new Error('At most 200 rows per request.');
    }
    const client = await makeClient(context.auth);
    const response = await client.batchCreateRows(table_id, rows);
    return { count: response.items.length, rows: response.items };
  },
});
