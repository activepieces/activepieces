import { createAction, Property } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { makeClient } from '../common';
import { baserowAiProps } from '../common/ai-props';
import { baserowAiHelpers } from '../common/ai-helpers';
import { createDatabaseOutputSchema } from '../output-schemas';

export const createDatabaseAction = createAction({
  name: 'baserow_create_database',
  classification: 'WRITE',
  outputSchema: createDatabaseOutputSchema,
  displayName: 'Create Database',
  description: 'Creates an empty database in a workspace.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new, empty Baserow database in a workspace and returns its ID. Follow with Create Table to add tables. Requires an Email & Password connection. Not idempotent — each call creates another database.',
    idempotent: false,
  },
  auth: baserowAuth,
  props: {
    workspace_id: baserowAiProps.workspaceIdProp(),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Name of the new database (max 160 characters).',
      required: true,
    }),
  },
  async run(context) {
    const { workspace_id, name } = context.propsValue;
    baserowAiHelpers.assertJwt({ auth: context.auth, actionName: 'Create Database' });
    const client = await makeClient(context.auth);
    const database = await baserowAiHelpers.execute(() =>
      client.createDatabase({ workspaceId: workspace_id, name })
    );
    return { id: database['id'], name: database['name'], workspace: database['workspace'] };
  },
});
