import { createAction } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { makeClient } from '../common';
import { baserowAiHelpers } from '../common/ai-helpers';
import { listTablesOutputSchema } from '../output-schemas';

export const listTablesAction = createAction({
  name: 'baserow_list_tables',
  classification: 'SEARCH',
  outputSchema: listTablesOutputSchema,
  displayName: 'List Tables',
  description: 'Lists the tables the connection can access.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists every Baserow table the connection can reach, with its ID, name and database ID. Call this first to get the Table ID every row action needs. Works with Database Token and Email & Password connections. Read-only and idempotent.',
    idempotent: true,
  },
  auth: baserowAuth,
  props: {},
  async run(context) {
    const client = await makeClient(context.auth);
    const tables = await baserowAiHelpers.execute(() => client.listTables());
    return {
      count: tables.length,
      tables: tables.map((table) => ({
        id: table.id,
        name: table.name,
        database_id: table.database_id,
      })),
    };
  },
});
