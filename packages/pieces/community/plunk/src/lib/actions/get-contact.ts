import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { plunkAuth } from '../..';

export const plunkGetContactAction = createAction({
  auth: plunkAuth,
  name: 'plunk_get_contact',
  displayName: 'Get Contact',
  description: 'Retrieve a contact by their ID.',
  props: {
    contact_id: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The unique ID of the contact.',
      required: true,
    }),
  },
  run: async ({ auth, propsValue }) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.useplunk.com/v1/contacts/${encodeURIComponent(propsValue.contact_id)}`,
      headers: {
        Authorization: `Bearer ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    return response.body;
  },
});
