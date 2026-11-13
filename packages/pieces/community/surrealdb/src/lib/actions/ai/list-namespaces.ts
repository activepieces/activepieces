import { createAction } from '@activepieces/pieces-framework';
import { surrealdbAuth } from '../../auth';
import { surrealdbApi } from '../../common/api';
import type { SurrealdbRootStructure } from '../../common/types';
import { surrealdbListNamespacesOutputSchema } from '../../output-schemas';

export const listNamespacesAction = createAction({
  auth: surrealdbAuth,
  name: 'surrealdb_list_namespaces',
  outputSchema: surrealdbListNamespacesOutputSchema,
  displayName: 'List Namespaces',
  description: 'Lists the namespaces on the SurrealDB server.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Returns every namespace defined on the server. Needs a root-level user; namespace and database users get a permission error. Use List Databases for the databases inside the connection\'s namespace. Read-only.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const info = await surrealdbApi.rpcQuery<SurrealdbRootStructure>({ auth: context.auth, sql: 'INFO FOR ROOT STRUCTURE;', vars: {} });
    const namespaces = info.namespaces ?? [];
    return { namespaces, count: namespaces.length };
  },
});
