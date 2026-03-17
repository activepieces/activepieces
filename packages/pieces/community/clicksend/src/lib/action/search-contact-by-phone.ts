import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callClickSendApi, clicksendCommon } from '../common';
import { clicksendAuth } from '../..';

function isValidPhone(phone: string) {
  return /^\+?[1-9]\d{1,14}$/.test(phone);
}

export const clicksendFindContactByPhoneAction = createAction({
  auth: clicksendAuth,
  name: 'find_contact_by_phone',
  description: 'Finds contact by phone number.',
  displayName: 'Find Contact by Phone',
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
    let currentPage = 1;
    let hasNext = true;

    do {
      const response = await callClickSendApi<{
        data: {
          next_page_url?: string;
          data: { phone_number: string }[];
        };
      }>({
        method: HttpMethod.GET,
        username,
        password,
        path: `/lists/${contact_list_id}/contacts`,
        query: { page: currentPage.toString(), limit: '100' },
      });

      const items = response.body.data?.data ?? [];

      const matched = items.find((item) => item.phone_number === phone_number);

      if (matched) {
        return {
          found: true,
          data: matched,
        };
      }

      currentPage++;
      hasNext = !!response.body.data?.next_page_url;
    } while (hasNext);

    return {
      found: false,
      data: {},
    };
  },
});
