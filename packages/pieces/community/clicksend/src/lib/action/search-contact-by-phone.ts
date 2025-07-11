import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callClickSendApi, clicksendCommon } from '../common';
import { clicksendAuth } from '../..';

function isValidPhone(phone: string) {
  return /^\+?[1-9]\d{1,14}$/.test(phone);
}

export const clicksendSearchContactByPhone = createAction({
  auth: clicksendAuth,
  name: 'search_contact_by_phone',
  description: 'Search for a contact by phone number',
  displayName: 'Search Contact by Phone',
  props: {
    contact_list_id: clicksendCommon.contact_list_id,
    phone_number: clicksendCommon.phone_number,
  },
  async run(context) {
    const { contact_list_id, phone_number } = context.propsValue;
    if (!isValidPhone(phone_number)) {
      throw new Error('Invalid phone number.');
    }
    const username = context.auth.username;
    const password = context.auth.password;
    const result = await callClickSendApi(
      HttpMethod.GET,
      `lists/${contact_list_id}/contacts?q=${encodeURIComponent(phone_number)}`,
      { username, password }
    );
    if (!(result?.body && (result.body as any).data && (result.body as any).data.length > 0)) {
      throw new Error('No contact found with this phone number.');
    }
    return result;
  },
}); 