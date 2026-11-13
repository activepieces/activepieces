import { createAction } from '@activepieces/pieces-framework';
import { TeableCommon } from '../common';
import { teableClient } from '../common/client';
import { TeableAuth } from '../auth';
import { teableOutputSchemas } from '../output-schemas';

export const deleteRecordAction = createAction({
  auth: TeableAuth,
  name: 'teable_delete_record',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Record',
  description: 'Deletes a record from a Teable table by its ID.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently removes one record from a Teable table by its record ID. Deleting the same ID again still succeeds and the record stays gone, so a retry is safe.',
    idempotent: true,
  },
  props: {
    base_id: TeableCommon.base_id,
    table_id: TeableCommon.table_id,
    record_id: TeableCommon.record_id,
  },
  outputSchema: teableOutputSchemas.deleteRecord,
  async run(context) {
    const { table_id, record_id } = context.propsValue;
    await teableClient.deleteRecord({
      auth: context.auth,
      tableId: table_id,
      recordId: record_id,
    });
    return { success: true, recordId: record_id };
  },
});
