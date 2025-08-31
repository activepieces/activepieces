import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { krispcallAuth } from '../..';

export const addContact = createAction({
  name: 'addContact',
  displayName: 'Add Contact',
  auth: krispcallAuth,
  description: 'Add contact in Krispcall',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Enter your name',
      required: false,
    }),
    number: Property.ShortText({
      displayName: 'Contact number',
      description: 'Enter contact number',
      required: true,
    }),
    address: Property.ShortText({
      displayName: 'Address',
      description: 'Enter your address',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      description: 'Enter your company',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Enter your email',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const res = await httpClient.sendRequest<string[]>({
      method: HttpMethod.POST,
      url: 'https://app.krispcall.com/api/v3/platform/activepiece/add-contact',
      headers: {
        'X-API-KEY': auth.apiKey,
      },
      body: {
        name: propsValue.name,
        number: propsValue.number,
        company: propsValue.company,
        email: propsValue.email,
        address: propsValue.address,
      },
    });
    return res.body;
  },
});
