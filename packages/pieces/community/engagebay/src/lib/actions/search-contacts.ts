import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { engagebayAuth } from '../auth';
import { engagebayRequest } from '../common/client';

export const searchContactsAction = createAction({
  auth: engagebayAuth,
  name: 'search_contacts',
  displayName: 'Search Contacts',
  description: 'Search contacts by keyword in EngageBay.',
  props: {
    keyword: Property.ShortText({
      displayName: 'Search Keyword',
      description: 'Search by name, email, or phone.',
      required: true,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number for pagination.',
      required: false,
      defaultValue: 0,
    }),
    size: Property.Number({
      displayName: 'Page Size',
      description: 'Number of contacts per page.',
      required: false,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const { keyword, page, size } = context.propsValue;

    return await engagebayRequest({
      apiKey: context.auth,
      method: HttpMethod.POST,
      path: '/api/panel/users/search',
      body: {
        search: keyword,
        page: page ?? 0,
        size: size ?? 20,
      },
    });
  },
});
