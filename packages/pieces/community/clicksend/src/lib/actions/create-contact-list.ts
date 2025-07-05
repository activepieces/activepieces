import { createAction, Property } from '@activepieces/pieces-framework';
import { clicksendAuth } from '../../index';
import { makeRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const createContactList = createAction({
  auth: clicksendAuth,
  name: 'createContactList',
  displayName: 'Create Contact List',
  description: 'Create a new contact list in ClickSend',
  props: {
    list_name: Property.ShortText({
      displayName: 'List Name',
      description: 'The name for the new contact list',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { username, password } = auth;
    const apiKey = `${username}:${password}`;

    const requestBody = {
      list_name: propsValue.list_name,
    };

    const response = await makeRequest(
      apiKey,
      HttpMethod.POST,
      '/lists',
      undefined,
      requestBody
    );

    return response;
  },
});
