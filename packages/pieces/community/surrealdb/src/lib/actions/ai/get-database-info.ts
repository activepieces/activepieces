import { createAction } from '@activepieces/pieces-framework';
import { surrealdbAuth } from '../../auth';
import { surrealdbApi } from '../../common/api';
import { surrealdbGetDatabaseInfoOutputSchema } from '../../output-schemas';

export const getDatabaseInfoAction = createAction({
  auth: surrealdbAuth,
  name: 'surrealdb_get_database_info',
  outputSchema: surrealdbGetDatabaseInfoOutputSchema,
  displayName: 'Get Database Info',
  description: 'Gets everything defined in the connected database.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns the definitions in the connection\'s database: tables, functions (with arguments and body), params, accesses, analyzers, users, sequences, APIs and configs. Use List Tables when only the tables are needed, and Describe Table for one table\'s fields. Read-only.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    return await surrealdbApi.rpcQuery<Record<string, unknown>>({ auth: context.auth, sql: 'INFO FOR DB STRUCTURE;', vars: {} });
  },
});
