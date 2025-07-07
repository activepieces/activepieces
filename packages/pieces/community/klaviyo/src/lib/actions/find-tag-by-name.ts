import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoApiCall } from '../common/client';
import { klaviyoAuth } from '../common/auth';

export const findTagsAction = createAction({
  auth: klaviyoAuth,
  name: 'get-tags',
  displayName: 'Get Tags',
  description: 'Retrieve a list of tags in the Klaviyo account.',
  props: {
    nameFilter: Property.ShortText({
      displayName: 'Filter by Name',
      required: false,
      description: 'Filter tags by name using "contains", "starts-with", etc.',
    }),
    sort: Property.StaticDropdown({
      displayName: 'Sort By',
      required: false,
      options: {
        options: [
          { label: 'Name Ascending', value: 'name' },
          { label: 'Name Descending', value: '-name' },
          { label: 'ID Ascending', value: 'id' },
          { label: 'ID Descending', value: '-id' },
        ],
      },
    }),
    pageCursor: Property.ShortText({
      displayName: 'Page Cursor',
      required: false,
      description: 'For paginating through results. Use next/prev cursor from response.',
    }),
  },
  async run({ auth, propsValue }) {
    const { nameFilter, sort, pageCursor } = propsValue;

    const query: Record<string, string> = {};
    if (nameFilter) query['filter'] = `name:contains:${nameFilter}`;
    if (sort) query['sort'] = sort;
    if (pageCursor) query['page[cursor]'] = pageCursor;

    const response = await klaviyoApiCall({
      apiKey: auth,
      method: HttpMethod.GET,
      resourceUri: '/tags',
      query,
    });

    return response;
  },
});
