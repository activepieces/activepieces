import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callClickSendApi } from '../common';
import { clicksendAuth } from '../..';

export const clicksendSearchContactLists = createAction({
  auth: clicksendAuth,
  name: 'search_contact_lists',
  description: 'Get all contact lists',
  displayName: 'Search Contact Lists',
  props: {},
  async run(context) {
    const username = context.auth.username;
    const password = context.auth.password;

    return await callClickSendApi(
      HttpMethod.GET,
      'lists',
      { username, password }
    );
  },
}); 