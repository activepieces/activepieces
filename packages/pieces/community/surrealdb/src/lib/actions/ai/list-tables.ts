import { createAction } from '@activepieces/pieces-framework';
import { surrealdbAuth } from '../../auth';
import { surrealdbApi } from '../../common/api';
import type { SurrealdbDbStructure } from '../../common/types';
import { surrealdbListTablesOutputSchema } from '../../output-schemas';

export const listTablesAction = createAction({
  auth: surrealdbAuth,
  name: 'surrealdb_list_tables',
  outputSchema: surrealdbListTablesOutputSchema,
  displayName: 'List Tables',
  description: 'Lists the tables defined in the connected database.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Returns every table defined in the connection\'s database with its kind (normal or relation), whether it is schemafull, and its permissions. Use Describe Table for a table\'s fields and indexes. Read-only.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const info = await surrealdbApi.rpcQuery<SurrealdbDbStructure>({ auth: context.auth, sql: 'INFO FOR DB STRUCTURE;', vars: {} });
    const tables = info.tables ?? [];
    return { tables, count: tables.length };
  },
});
