import {
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { TeableCommon, makeClient } from '../common';
import { TeableAuth } from '../auth';

export const deleteRecordAction = createAction({
  auth: TeableAuth,
  name: 'teable_delete_record',
  displayName: 'Delete Record',
  description: 'Deletes a record from a Teable table by its ID.',
  props: {
    base_id: TeableCommon.base_id,
    table_id: TeableCommon.table_id,
    recordId: Property.ShortText({
      displayName: 'Record ID',
      description: 'The ID of the record to delete (e.g. recXXXXXXX).',
      required: true,
    }),
  },
  async run(context) {
    const { table_id, recordId } = context.propsValue;
    const client = makeClient(context.auth.props);
    return await client.deleteRecord(table_id, recordId);
  },
});

