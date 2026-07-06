import { createAction, Property } from '@activepieces/pieces-framework';

import { githubAuth } from '../auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { githubAuthHelpers, GithubAuthValue } from '../common/auth-helpers';

export const githubRawGraphqlQuery = createAction({
  name: 'rawGraphqlQuery',
  displayName: 'Raw GraphQL query',
  description: 'Perform a raw GraphQL query',
  audience: 'both',
  aiMetadata: {
    description:
      "Sends an arbitrary GraphQL query or mutation to GitHub's GraphQL API with optional variables. Use as an escape hatch when no dedicated action covers the needed operation. Idempotency depends entirely on the query you pass — a read query is safe to repeat, a mutation is not.",
    idempotent: false,
  },
  auth: githubAuth,
  props: {
    query: Property.LongText({ displayName: 'Query', required: true }),
    variables: Property.Object({ displayName: 'Parameters', required: false }),
  },
  async run({ auth, propsValue }) {
    const token = await githubAuthHelpers.getBearerToken(
      auth as GithubAuthValue
    );
    const response = await httpClient.sendRequest({
      url: 'https://api.github.com/graphql',
      method: HttpMethod.POST,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: propsValue.query,
        variables: propsValue.variables,
      }),
    });

    return response;
  },
});
