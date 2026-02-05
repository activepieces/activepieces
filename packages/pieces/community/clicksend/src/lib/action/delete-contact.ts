import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callClickSendApi, clicksendCommon } from '../common';
import { clicksendAuth } from '../..';

export const clicksendDeleteContactAction = createAction({
  auth: clicksendAuth,
  name: 'delete_contact',
  description: 'Deletes a contact from a contact list.',
  displayName: 'Delete Contact',
  props: {
    contact_list_id: clicksendCommon.contact_list_id,
    contact_id: clicksendCommon.contact_id,
  },
  async run(context) {
    const { contact_id,contact_list_id } = context.propsValue;
    const username = context.auth.username;
    const password = context.auth.password;
    try {
      await callClickSendApi({
        method: HttpMethod.DELETE,
        path: `/lists/${contact_list_id}/contacts/${contact_id}`,
        username,
        password,
      });
      return { success: true, message: 'Contact deleted.' };
    } catch (error: any) {
      if (error?.response?.status === 404) {
        throw new Error('Contact not found.');
      }
      if (error?.response?.status === 403) {
        throw new Error('Permission denied.');
      }
      throw error;
    }
  },
});
