import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callClickSendApi, clicksendCommon } from '../common';
import { clicksendAuth } from '../..';

export const clicksendDeleteContact = createAction({
  auth: clicksendAuth,
  name: 'delete_contact',
  description: 'Delete a contact from a contact list',
  displayName: 'Delete Contact',
  props: {
    contact_id: clicksendCommon.contact_id,
  },
  async run(context) {
    const { contact_id } = context.propsValue;
    const username = context.auth.username;
    const password = context.auth.password;

    return await callClickSendApi(
      HttpMethod.DELETE,
      `contacts/${contact_id}`,
      { username, password }
    );
  },
}); 