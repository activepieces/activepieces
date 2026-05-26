import { createAction, Property } from '@activepieces/pieces-framework';

import { githubAuth } from '../auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { githubAuthHelpers, GithubAuthValue } from '../common/auth-helpers';

export const githubRawGraphqlQuery = createAction({
  name: 'rawGraphqlQuery',
  displayName: 'Raw GraphQL query',
  description: 'Perform a raw GraphQL query',
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
