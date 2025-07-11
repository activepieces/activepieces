import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callClickSendApi, clicksendCommon } from '../common';
import { clicksendAuth } from '../..';

function isValidEmail(email: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

export const clicksendSearchContactByEmail = createAction({
  auth: clicksendAuth,
  name: 'search_contact_by_email',
  description: 'Search for a contact by email address',
  displayName: 'Search Contact by Email',
  props: {
    contact_list_id: clicksendCommon.contact_list_id,
    email: clicksendCommon.email,
  },
  async run(context) {
    const { contact_list_id, email } = context.propsValue;
    if (!isValidEmail(email)) {
      throw new Error('Invalid email address.');
    }
    const username = context.auth.username;
    const password = context.auth.password;
    const result = await callClickSendApi(
      HttpMethod.GET,
      `lists/${contact_list_id}/contacts?q=${encodeURIComponent(email)}`,
      { username, password }
    );
    if (!(result?.body && (result.body as any).data && (result.body as any).data.length > 0)) {
      throw new Error('No contact found with this email.');
    }
    return result;
  },
}); 