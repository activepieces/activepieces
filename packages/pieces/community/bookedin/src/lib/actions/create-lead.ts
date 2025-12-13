import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { bookedinAuth } from '../../index';
import { BASE_URL, getBookedinHeaders } from '../common/props';

export const createLead = createAction({
  name: 'createLead',
  displayName: 'Create Lead',
  description: 'Creates a new lead in Bookedin AI',
  auth: bookedinAuth,
  props: {
    // --- Contact Information ---
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
    
    const apiKey = typeof auth === 'string' 
      ? auth 
      : (auth as any)?.secret_text || (auth as any)?.auth;

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
        ...getBookedinHeaders(apiKey as string),
        'Content-Type': 'application/json',
      },
      body: payload,
    });

    return response.body;
  },
});