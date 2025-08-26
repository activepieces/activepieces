import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { krispcallAuth } from '../..';

export const deleteContacts = createAction({
  name: 'deleteContacts',
  displayName: 'Delete Contacts',
  auth: krispcallAuth,
  description: 'Delete contacts from krispcall.',
  props: {
    contacts: Property.Array({
      displayName: 'Contacts',
      description: 'Enter contact which you want to delete.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const res = await httpClient.sendRequest<string[]>({
      method: HttpMethod.DELETE,
      url: 'https://app.krispcall.com/api/v3/platform/activepiece/delete-contacts',
      headers: {
        'X-API-KEY': auth.apiKey,
      },
      body: {
        contacts: propsValue.contacts,
      },
    });
    return res.body;
  },
});
