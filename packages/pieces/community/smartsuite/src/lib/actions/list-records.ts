import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { smartsuiteAuth, workspaceId, tableId } from '../auth';
import { SmartSuiteClient } from '../common/client';

/**
 * List Records Action
 */
export const listRecords = createAction({
  auth: smartsuiteAuth,
  displayName: 'List Records',
  description: 'List records from a SmartSuite table',
  props: {
    workspace_id: workspaceId,
    table_id: tableId,
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of records to return (default: 100)',
      required: false,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of records to skip (default: 0)',
      required: false,
    }),
  },
  async run(context) {
    const client = new SmartSuiteClient(context.auth, context.propsValue.workspace_id);
    return await client.listRecords(
      context.propsValue.table_id,
      context.propsValue.limit ?? 100,
      context.propsValue.offset ?? 0
    );
  },
});
