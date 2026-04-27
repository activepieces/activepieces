import { createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { plunkAuth, PLUNK_BASE_URL } from '../../index';

export const getContacts = createAction({
  auth: plunkAuth,
  name: 'get_all_contacts',
  displayName: 'Get All Contacts',
  description: 'Retrieve every contact in your Plunk project.',
  props: {},
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${PLUNK_BASE_URL}/contacts`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.props.secretKey,
      },
    });
    return response.body;
  },
});
