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
    const username = context.auth.username;
    const password = context.auth.password;
    
    const listData = {
      list_name: list_name,
    };

    return await callClickSendApi(
      HttpMethod.POST,
      'lists',
      { username, password },
      listData
    );
  },
}); 