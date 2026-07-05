import { createAction, Property } from '@activepieces/pieces-framework';
import { chaindeskAuth } from '../common/auth';
import {  datastoreIdDropdown } from '../common/props';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { BASE_URL } from '../common/constants';

export const queryDatastoretAction = createAction({
  displayName: 'Query Datastore',
  name: 'query-datastore',
  auth: chaindeskAuth,
  description: 'Asks question to your Datastore.',
  audience: 'both',
  aiMetadata: { description: 'Runs a semantic search query against a specific Chaindesk datastore (selected by datastore ID) and returns the matching documents/chunks. Use to retrieve relevant knowledge-base content for a question without invoking an agent. Read-only and idempotent: the same query returns the same matches with no side effects.', idempotent: true },
  props: {
    datastoreId: datastoreIdDropdown,
    query: Property.LongText({
      displayName: 'Query',
      required: true,
    }),
  },
  async run(context) {
    const { query, datastoreId } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: BASE_URL + `/datastores/${datastoreId}/query`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },  
      body: {
        query,
      },
    });

    return response.body;
  },
});
