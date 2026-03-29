import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { smartsuiteAuth, workspaceId, tableId } from '../auth';
import { SmartSuiteClient } from '../common/client';

/**
 * Delete Record Action
 */
export const deleteRecord = createAction({
  auth: smartsuiteAuth,
  displayName: 'Delete Record',
  description: 'Delete a record from a SmartSuite table',
  props: {
    workspace_id: workspaceId,
    table_id: tableId,
    record_id: Property.ShortText({
      displayName: 'Record ID',
      description: 'The ID of the record to delete',
      required: true,
    }),
  },
  async run(context) {
    const client = new SmartSuiteClient(context.auth, context.propsValue.workspace_id);
    return await client.deleteRecord(
      context.propsValue.table_id,
      context.propsValue.record_id
    );
  },
});
