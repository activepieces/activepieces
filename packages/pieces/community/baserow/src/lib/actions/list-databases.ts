import { createAction } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { makeClient } from '../common';
import { baserowAiHelpers } from '../common/ai-helpers';
import { listDatabasesOutputSchema } from '../output-schemas';

export const listDatabasesAction = createAction({
  name: 'baserow_list_databases',
  classification: 'SEARCH',
  outputSchema: listDatabasesOutputSchema,
  displayName: 'List Databases',
  description: 'Lists the databases the user can access.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists every Baserow database the connected user can access across workspaces, with its ID, name, workspace and tables. Use to get the Database ID for Create Table; to just find a table use List Tables. Requires an Email & Password connection. Read-only and idempotent.',
    idempotent: true,
  },
  auth: baserowAuth,
  props: {},
  async run(context) {
    baserowAiHelpers.assertJwt({ auth: context.auth, actionName: 'List Databases' });
    const client = await makeClient(context.auth);
    const applications = await baserowAiHelpers.execute(() => client.listApplications());
    const databases = applications.filter((application) => application.type === 'database');
    return {
      count: databases.length,
      databases: databases.map((database) => ({
        id: database.id,
        name: database.name,
        workspace_id: database.workspace?.id,
        workspace_name: database.workspace?.name,
        tables: (database.tables ?? []).map((table) => ({ id: table.id, name: table.name })),
      })),
    };
  },
});
