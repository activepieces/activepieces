import { Property, createAction } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { baserowCommon, makeClient } from '../common';
import { batchDeleteRowsOutputSchema } from '../output-schemas';

export const batchDeleteRowsAction = createAction({
  name: 'baserow_batch_delete_rows',
  classification: 'DESTRUCTIVE',
  outputSchema: batchDeleteRowsOutputSchema,
  displayName: 'Batch Delete Rows',
  description: 'Deletes up to 200 rows in one request.',
  audience: 'human',
  aiMetadata: {
    description:
      'Permanently deletes many Baserow rows in one request from a list of numeric row IDs, up to 200 per call. Use for bulk removal of known rows; for a single row use Delete Row. Destructive — verify the IDs first (List Rows or Find Row can supply them). Not idempotent against changing data once the rows are removed.',
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
      label: 'Rows to Delete',
      icon: 'trash',
      props: ['row_ids'],
    },
  ],
  props: {
    table_id: baserowCommon.tableId(),
    row_ids: Property.Array({
      displayName: 'Row IDs',
      description: 'Up to 200 row IDs, for example from List Rows or Find Row.',
      required: true,
    }),
  },
  async run(context) {
    const table_id = context.propsValue.table_id!;
    const row_ids = context.propsValue.row_ids;
    const ids = Array.isArray(row_ids)
      ? row_ids
          .map((id) => parseInt(String(id), 10))
          .filter((id) => !isNaN(id))
      : [];
    if (ids.length === 0) {
      throw new Error('Row IDs must contain at least one number.');
    }
    if (ids.length > 200) {
      throw new Error('At most 200 rows per request.');
    }
    const client = await makeClient(context.auth);
    await client.batchDeleteRows(table_id, ids);
    return { deleted_count: ids.length };
  },
});
