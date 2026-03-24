import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { plunkAuth } from '../..';

export const plunkGetContactsAction = createAction({
  auth: plunkAuth,
  name: 'plunk_get_contacts',
  displayName: 'Get All Contacts',
  description: 'Retrieve all contacts from your Plunk account.',
  props: {},
  run: async ({ auth }) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.useplunk.com/v1/contacts',
      headers: {
        Authorization: `Bearer ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    return response.body;
  },
});
