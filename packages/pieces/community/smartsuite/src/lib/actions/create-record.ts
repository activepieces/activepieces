import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { smartsuiteAuth, workspaceId, tableId } from '../auth';
import { SmartSuiteClient } from '../common/client';

/**
 * Create Record Action
 */
export const createRecord = createAction({
  auth: smartsuiteAuth,
  displayName: 'Create Record',
  description: 'Create a new record in a SmartSuite table',
  props: {
    workspace_id: workspaceId,
    table_id: tableId,
    fields: Property.Json({
      displayName: 'Fields',
      description: 'Record fields as JSON object (key: field name, value: field value)',
      required: true,
    }),
  },
  async run(context) {
    const client = new SmartSuiteClient(context.auth, context.propsValue.workspace_id);
    return await client.createRecord(
      context.propsValue.table_id,
      context.propsValue.fields as Record<string, any>
    );
  },
});
