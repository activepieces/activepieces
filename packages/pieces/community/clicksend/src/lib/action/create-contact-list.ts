import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callClickSendApi } from '../common';
import { clicksendAuth } from '../..';

export const clicksendCreateContactList = createAction({
  auth: clicksendAuth,
  name: 'create_contact_list',
  description: 'Create a new contact list',
  displayName: 'Create Contact List',
  props: {
    list_name: Property.ShortText({
      description: 'The name of the contact list',
      displayName: 'List Name',
      required: true,
    }),
  },
  async run(context) {
    const { list_name } = context.propsValue;
    if (!list_name || list_name.trim().length === 0) {
      throw new Error('List name must not be empty.');
    }
    const username = context.auth.username;
    const password = context.auth.password;
    const listData = {
      list_name: list_name,
    };
    try {
      return await callClickSendApi(
        HttpMethod.POST,
        'lists',
        { username, password },
        listData
      );
    } catch (error: any) {
      if (error?.response?.body?.response_code === 'ALREADY_EXISTS') {
        throw new Error('A contact list with this name already exists.');
      }
      throw error;
    }
  },
}); 