import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callClickSendApi } from '../common';
import { clicksendAuth } from '../..';

export const clicksendFindContactListAction = createAction({
  auth: clicksendAuth,
  name: 'find_contact_lists',
  description: 'Finds for contact list based on name.',
  displayName: 'Find Contact List',
  props: {
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Search by list name.',
      required: true,
    }),
  },
  async run(context) {
    const { search } = context.propsValue;
    const username = context.auth.username;
    const password = context.auth.password;

    let currentPage = 1;
    let hasNext = true;
    do {
      const response = await callClickSendApi<{
        data: {
          next_page_url?: string;
          data: { list_id: number; list_name: string }[];
        };
      }>({
        method: HttpMethod.GET,
        username,
        password,
        path: '/lists',
        query: { page: currentPage.toString(), limit: '100' },
      });

      const items = response.body.data?.data ?? [];

      const matched = items.find((item) => item.list_name === search);

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
