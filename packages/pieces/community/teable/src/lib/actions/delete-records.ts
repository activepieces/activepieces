import { Property, createAction } from '@activepieces/pieces-framework';
import { TeableAuth } from '../auth';
import { TeableCommon } from '../common';
import { teableClient } from '../common/client';
import { teableOutputSchemas } from '../output-schemas';

const MAX_BATCH_SIZE = 1000;

export const deleteRecordsAction = createAction({
  auth: TeableAuth,
  name: 'teable_delete_records',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Records',
  description: 'Permanently deletes multiple records from a Teable table by their IDs.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently removes up to 1000 records from a Teable table in one call, by their record IDs. Refuses an empty ID list. Deleting the same IDs again still succeeds, so a retry is safe.',
    idempotent: true,
  },
  props: {
    base_id: TeableCommon.base_id,
    table_id: TeableCommon.table_id,
    recordIds: Property.Array({
      displayName: 'Record IDs',
      description: 'The IDs of the records to delete.',
      required: true,
    }),
  },
  outputSchema: teableOutputSchemas.deleteRecords,
  async run(context) {
    const recordIds = (context.propsValue.recordIds ?? [])
      .map((id) => String(id).trim())
      .filter((id) => id.length > 0);
    if (recordIds.length === 0) {
      throw new Error('Record IDs must contain at least one record ID.');
    }
    if (recordIds.length > MAX_BATCH_SIZE) {
      throw new Error(
        `Record IDs holds ${recordIds.length} items; the maximum per call is ${MAX_BATCH_SIZE}.`
      );
    }
    await teableClient.deleteRecords({
      auth: context.auth,
      tableId: context.propsValue.table_id,
      recordIds,
    });
    return { success: true, deletedCount: recordIds.length, recordIds };
  },
});
