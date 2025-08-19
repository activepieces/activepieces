import { createAction, Property } from '@activepieces/pieces-framework';

import { githubAuth } from '../..';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';

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
    const response = await httpClient.sendRequest({
      url: 'https://api.github.com/graphql',
      method: HttpMethod.POST,
      body: JSON.stringify({
        query: propsValue.query,
        variables: propsValue.variables,
      }),
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.access_token,
      },
    });

    return response;
  },
});
