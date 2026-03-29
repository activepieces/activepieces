import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { smartsuiteAuth, workspaceId, tableId } from '../auth';
import { SmartSuiteClient } from '../lib/common/client';

/**
 * Update Record Action
 */
export const updateRecord = createAction({
  auth: smartsuiteAuth,
  displayName: 'Update Record',
  description: 'Update an existing record in a SmartSuite table',
  props: {
    workspace_id: workspaceId,
    table_id: tableId,
    record_id: Property.ShortText({
      displayName: 'Record ID',
      description: 'The ID of the record to update',
      required: true,
    }),
    fields: Property.Json({
      displayName: 'Fields',
      description: 'Record fields to update as JSON object',
      required: true,
    }),
  },
  async run(context) {
    const client = new SmartSuiteClient(context.auth, context.propsValue.workspace_id);
    return await client.updateRecord(
      context.propsValue.table_id,
      context.propsValue.record_id,
      context.propsValue.fields as Record<string, any>
    );
  },
});
