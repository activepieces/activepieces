import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { bookedinAuth } from '../../index';
import { BASE_URL, getBookedinHeaders, extractApiKey } from '../common/props';

export const createLead = createAction({
  name: 'createLead',
  displayName: 'Create Lead',
  description: 'Creates a new lead in Bookedin AI',
  auth: bookedinAuth,
  props: {
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: true,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
    phone: Property.ShortText({
      displayName: 'Phone Number',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const apiKey = extractApiKey(auth);

    const payload = {
      contact: {
        name: {
          last: propsValue.lastName,
          first: propsValue.firstName,
        },
        email: propsValue.email,
        number: propsValue.phone,
      },
    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${BASE_URL}/leads/`,
      headers: {
        ...getBookedinHeaders(apiKey),
        'Content-Type': 'application/json',
      },
      body: payload,
    });

    return response.body;
  },
});