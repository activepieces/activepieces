import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { smartsuiteAuth, workspaceId, tableId } from '../auth';
import { SmartSuiteClient } from '../common/client';

/**
 * Search Records Action
 */
export const searchRecords = createAction({
  auth: smartsuiteAuth,
  displayName: 'Search Records',
  description: 'Search for records in a SmartSuite table',
  props: {
    workspace_id: workspaceId,
    table_id: tableId,
    query: Property.Json({
      displayName: 'Search Query',
      description: 'Search query as JSON (SmartSuite filter format)',
      required: true,
    }),
  },
  async run(context) {
    const client = new SmartSuiteClient(context.auth, context.propsValue.workspace_id);
    return await client.searchRecords(
      context.propsValue.table_id,
      context.propsValue.query as Record<string, any>
    );
  },
});
