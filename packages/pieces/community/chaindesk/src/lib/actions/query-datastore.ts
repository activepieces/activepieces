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
