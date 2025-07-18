import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callClickSendApi } from '../common';
import { clicksendAuth } from '../..';

export const clicksendCreateContactListAction = createAction({
  auth: clicksendAuth,
  name: 'create_contact_list',
  description: 'Creates a new contact list.',
  displayName: 'Create Contact List',
  props: {
    list_name: Property.ShortText({
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
      const response = await callClickSendApi({
        method: HttpMethod.POST,
        path: '/lists',
        username,
        password,
        body: listData,
      });
      return response.body;
    } catch (error: any) {
      if (error?.response?.body?.response_code === 'ALREADY_EXISTS') {
        throw new Error('A contact list with this name already exists.');
      }
      throw error;
    }
  },
});
