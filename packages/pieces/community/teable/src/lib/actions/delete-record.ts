import { createAction } from '@activepieces/pieces-framework';
import { TeableCommon, makeClient } from '../common';
import { TeableAuth, TeableAuthValue } from '../auth';

export const deleteRecordAction = createAction({
  auth: TeableAuth,
  name: 'teable_delete_record',
  displayName: 'Delete Record',
  description: 'Deletes a record from a Teable table by its ID.',
  props: {
    base_id: TeableCommon.base_id,
    table_id: TeableCommon.table_id,
    record_id: TeableCommon.record_id,
  },
  async run(context) {
    const { table_id, record_id } = context.propsValue;
    const client = makeClient(context.auth as TeableAuthValue);
    return await client.deleteRecord(table_id, record_id);
  },
});
