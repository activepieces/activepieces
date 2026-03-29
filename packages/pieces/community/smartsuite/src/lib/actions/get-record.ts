import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { smartsuiteAuth, workspaceId, tableId } from '../auth';
import { SmartSuiteClient } from '../lib/common/client';

/**
 * Get Record Action
 */
export const getRecord = createAction({
  auth: smartsuiteAuth,
  displayName: 'Get Record',
  description: 'Get a specific record from a SmartSuite table',
  props: {
    workspace_id: workspaceId,
    table_id: tableId,
    record_id: Property.ShortText({
      displayName: 'Record ID',
      description: 'The ID of the record to retrieve',
      required: true,
    }),
  },
  async run(context) {
    const client = new SmartSuiteClient(context.auth, context.propsValue.workspace_id);
    return await client.getRecord(
      context.propsValue.table_id,
      context.propsValue.record_id
    );
  },
});
