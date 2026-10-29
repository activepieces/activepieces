import { Property, createAction } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { baserowCommon, makeClient } from '../common';
import { batchRowsOutputSchema } from '../output-schemas';

export const batchUpdateRowsAction = createAction({
  name: 'baserow_batch_update_rows',
  classification: 'WRITE',
  outputSchema: batchRowsOutputSchema,
  displayName: 'Batch Update Rows',
  description: 'Updates up to 200 rows in one request.',
  audience: 'human',
  aiMetadata: {
    description:
      'Updates many existing Baserow rows in one request from a JSON array, up to 200 rows per call. Every object must carry an "id" identifying the row plus the fields to change. Use for bulk edits to known rows instead of repeated Update Row calls. Idempotent: re-sending the same id/field values converges those rows to the same state.',
    idempotent: true,
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
      label: 'Rows to Update',
      icon: 'code',
      props: ['rows'],
    },
  ],
  props: {
    table_id: baserowCommon.tableId(),
    rows: Property.Json({
      displayName: 'Rows',
      description:
        'A JSON list of up to 200 rows, each with its id and the new values.',
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
    if (rows.length > 200) {
      throw new Error('At most 200 rows per request.');
    }
    const client = await makeClient(context.auth);
    const response = await client.batchUpdateRows(table_id, rows);
    return { count: response.items.length, rows: response.items };
  },
});
