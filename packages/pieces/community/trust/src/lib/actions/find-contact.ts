import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { trustAuth } from '../auth';
import { trustApiRequest } from '../common/client';

export const findContactAction = createAction({
  auth: trustAuth,
  name: 'find_contact',
  displayName: 'Find Contact',
  description: 'Finds a contact by ID or email address.',
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The ID of the contact to find. Provide either Contact ID or Email — ID takes priority.',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Search for a contact by email address. Used only if Contact ID is not provided.',
      required: false,
    }),
  },
  async run(context) {
    const { props } = context.auth;
    const { contactId, email } = context.propsValue;

    if (!contactId && !email) {
      throw new Error('Provide either a Contact ID or an Email to find a contact.');
    }

    if (contactId) {
      const response = await trustApiRequest({
        apiKey: props.api_key,
        method: HttpMethod.GET,
        path: `/contacts/${contactId}`,
      });
      return response.body;
    }

    const response = await trustApiRequest({
      apiKey: props.api_key,
      method: HttpMethod.GET,
      path: '/contacts',
      queryParams: { email: email as string },
    });
    return response.body;
  },
});
