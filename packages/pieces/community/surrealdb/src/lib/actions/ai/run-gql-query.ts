import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { surrealdbAuth } from '../../auth';
import { surrealdbClient } from '../../common/client';
import type { SurrealdbStatementResult } from '../../common/types';
import { surrealdbUtils } from '../../common/utils';
import { surrealdbRunGqlQueryOutputSchema } from '../../output-schemas';

export const runGqlQueryAction = createAction({
  auth: surrealdbAuth,
  name: 'surrealdb_run_gql_query',
  outputSchema: surrealdbRunGqlQueryOutputSchema,
  displayName: 'Run GQL Query',
  description: 'Runs an ISO GQL graph query, e.g. MATCH (p:person) RETURN p.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Runs a GQL (ISO graph query language) statement such as MATCH (p:person)-[:knows]->(f) RETURN p, f and returns its result. Needs SurrealDB 3.3 or later (3.2 with the experimental flag). Use Find Related Records for simple edge lookups and Run Query for SurrealQL. Not idempotent when the statement writes.',
    idempotent: false,
  },
  props: {
    query: Property.LongText({
      displayName: 'GQL Query',
      description: 'GQL statement, e.g. MATCH (p:person) RETURN p.',
      required: true,
    }),
  },
  async run(context) {
    const statements = await surrealdbClient.request<SurrealdbStatementResult<unknown>[]>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/gql',
      headers: { 'Content-Type': 'text/plain' },
      body: context.propsValue.query,
    });
    return { result: surrealdbUtils.lastStatementResult({ statements }) };
  },
});
