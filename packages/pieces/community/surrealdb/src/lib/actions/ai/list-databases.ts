import { createAction } from '@activepieces/pieces-framework';
import { surrealdbAuth } from '../../auth';
import { surrealdbApi } from '../../common/api';
import type { SurrealdbNamespaceStructure } from '../../common/types';
import { surrealdbListDatabasesOutputSchema } from '../../output-schemas';

export const listDatabasesAction = createAction({
  auth: surrealdbAuth,
  name: 'surrealdb_list_databases',
  outputSchema: surrealdbListDatabasesOutputSchema,
  displayName: 'List Databases',
  description: 'Lists the databases in the connection\'s namespace.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Returns every database defined in the connection\'s namespace. Needs a namespace-level or root user; database users get a permission error. Read-only.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const info = await surrealdbApi.rpcQuery<SurrealdbNamespaceStructure>({ auth: context.auth, sql: 'INFO FOR NS STRUCTURE;', vars: {} });
    const databases = info.databases ?? [];
    return { databases, count: databases.length };
  },
});
