import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { PLUNK_BASE_URL, plunkAuth } from '../auth';

export const getContact = createAction({
  auth: plunkAuth,
  name: 'get_contact',
  displayName: 'Get Contact',
  description: 'Retrieve a single contact by ID.',
  audience: 'both',
  aiMetadata: {
    description:
      'Looks up a single Plunk contact by its contact ID. Use it when you already have the exact contact ID; to discover IDs first, list contacts with Get All Contacts. Read-only and idempotent.',
    idempotent: true,
  },
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
