import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { surrealdbAuth } from '../../auth';
import { surrealdbClient } from '../../common/client';
import type { SurrealdbGraphqlResponse } from '../../common/types';
import { surrealdbRunGraphqlQueryOutputSchema } from '../../output-schemas';

export const runGraphqlQueryAction = createAction({
  auth: surrealdbAuth,
  name: 'surrealdb_run_graphql_query',
  outputSchema: surrealdbRunGraphqlQueryOutputSchema,
  displayName: 'Run GraphQL Query',
  description: 'Runs a GraphQL query against the database.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Runs a GraphQL query and returns its data. Works only when the database has GraphQL enabled (DEFINE CONFIG GRAPHQL); table names become camelCase types (table "p3_person" is queried as p3Person / p3Persons). Fails with the GraphQL errors when the query is invalid. Read-only: SurrealDB GraphQL has no mutations.',
    idempotent: true,
  },
  props: {
    query: Property.LongText({
      displayName: 'GraphQL Query',
      description: 'GraphQL query, e.g. { person(limit: 10) { id name } }.',
      required: true,
    }),
    variables: Property.Json({
      displayName: 'Variables',
      description: 'Optional JSON object of GraphQL variables.',
      required: false,
    }),
  },
  async run(context) {
    const { query, variables } = context.propsValue;
    const response = await surrealdbClient.request<SurrealdbGraphqlResponse>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/graphql',
      headers: { 'Content-Type': 'application/json' },
      body: { query, variables },
    });
    if (response.errors && response.errors.length > 0) {
      throw new Error(`GraphQL error: ${response.errors.map((error) => error.message).join('; ')}`);
    }
    return { data: response.data ?? null };
  },
});
