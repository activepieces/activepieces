import { createAction, Property } from '@activepieces/pieces-framework';
import { xquikAuth } from '../auth';
import { xquikCommon } from '../common';

export const searchUsers = createAction({
  auth: xquikAuth,
  name: 'search_users',
  displayName: 'Search Users',
  description: 'Search public X/Twitter users by name or username.',
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: 'Name, username, brand, or keyword to search for.',
      required: true,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'Pagination cursor from a previous response.',
      required: false,
    }),
  },
  async run(context) {
    return xquikCommon.api.get({
      apiKey: context.auth.secret_text,
      path: '/x/users/search',
      queryParams: xquikCommon.utils.cleanQueryParams({
        cursor: context.propsValue.cursor,
        q: context.propsValue.query,
      }),
    });
  },
});
