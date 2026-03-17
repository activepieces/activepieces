import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callClickSendApi, clicksendCommon } from '../common';
import { clicksendAuth } from '../..';

function isValidEmail(email: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

export const clicksendFindContactByEmailAction = createAction({
  auth: clicksendAuth,
  name: 'find_contact_by_email',
  description: 'Finds contact by email address.',
  displayName: 'Find Contact by Email',
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

    let currentPage = 1;
    let hasNext = true;

    do {
      const response = await callClickSendApi<{
        data: {
          next_page_url?: string;
          data: { email: string }[];
        };
      }>({
        method: HttpMethod.GET,
        username,
        password,
        path: `/lists/${contact_list_id}/contacts`,
        query: { page: currentPage.toString(), limit: '100' },
      });

      const items = response.body.data?.data ?? [];

      const matched = items.find((item) => item.email === email);

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
