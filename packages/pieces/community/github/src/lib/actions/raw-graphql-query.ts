import { createAction, Property } from '@activepieces/pieces-framework';
import { Octokit } from 'octokit';

import { githubAuth } from '../..';

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
    const client = new Octokit({ auth: auth.access_token });
    return await client.graphql(propsValue.query, propsValue.variables);
  },
});
