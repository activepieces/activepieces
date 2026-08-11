import { createAction } from '@activepieces/pieces-framework';
import { postgresAuth } from '../..';
import { pgClient, postgresUtils } from '../common';
import { getTablesOutputSchema } from '../output-schemas';

export const getTables = createAction({
  auth: postgresAuth,
  name: 'get-tables',
  displayName: 'Get Tables',
  description: 'Returns the tables in the database',
  audience: 'both',
  outputSchema: getTablesOutputSchema,
  aiMetadata: {
    description: 'Lists every base table in the connected PostgreSQL database, each with its schema and table name. Use to discover the schema before reading or writing rows. Takes no input; read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const client = await pgClient(context.auth);
    try {
      const tables = await postgresUtils.listTables(client);
      return { tables };
    } finally {
      await client.end();
    }
  },
});
