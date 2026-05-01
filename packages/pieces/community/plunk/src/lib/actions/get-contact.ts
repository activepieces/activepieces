import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { plunkAuth, PLUNK_BASE_URL } from '../../index';

export const getContact = createAction({
  auth: plunkAuth,
  name: 'get_contact',
  displayName: 'Get Contact',
  description: 'Retrieve a single contact by ID.',
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The Plunk contact ID.',
      required: true,
    }),
  },
  async run(context) {
    const { contactId } = context.propsValue;
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${PLUNK_BASE_URL}/contacts/${encodeURIComponent(contactId)}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.props.secretKey,
      },
    });
    return response.body;
  },
});
