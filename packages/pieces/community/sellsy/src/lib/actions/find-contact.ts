import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sellsyAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const findContact = createAction({
  name: 'find_contact',
  displayName: 'Find Contact',
  description: 'Finds a contact in Sellsy',
  auth: sellsyAuth,
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Contact email to search for',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Contact phone to search for',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Contact name to search for',
      required: false,
    }),
  },
  async run(context) {
    const { access_token } = context.auth as { access_token: string };

    const params = new URLSearchParams();
    if (context.propsValue.email) params.append('email', context.propsValue.email);
    if (context.propsValue.phone) params.append('phone', context.propsValue.phone);
    if (context.propsValue.name) params.append('name', context.propsValue.name);

    const response = await makeRequest(
      { access_token },
      HttpMethod.GET,
      `/people?${params.toString()}`
    );
    return response;
  },
}); 