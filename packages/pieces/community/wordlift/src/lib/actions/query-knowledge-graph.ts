import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { wordliftAuth } from '../../index';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const queryKnowledgeGraph = createAction({
  auth: wordliftAuth,
  name: 'queryKnowledgeGraph',
  displayName: 'Query Knowledge Graph',
  description:
    'Run a GraphQL query on the Wordlift knowledge graph to retrieve specific data',
  props: {
    query: Property.LongText({
      displayName: 'GraphQL Query',
      description:
        'The GraphQL query string to execute against the knowledge graph',
      required: true,
    }),
  },
  async run(context) {
    const { query } = context.propsValue;
   const accessToken = context.auth.secret_text

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.wordlift.io/graphql',
      headers: {
        Authorization: `${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: {
        query,
      },
    });

    return response.body;
  },
});
