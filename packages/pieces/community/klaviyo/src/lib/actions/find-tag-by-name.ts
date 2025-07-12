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
      displayName: 'Name Contains',
      required: false,
      description: 'Filter tags where name contains this string.',
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
      description: 'Cursor for pagination.',
    }),
  },
  async run({ auth, propsValue }) {
    const { nameFilter, sort, pageCursor } = propsValue;

    const query: Record<string, string> = {};

    if (nameFilter?.trim()) {
      query['filter'] = `contains(name,"${nameFilter.trim()}")`;
    }

    if (sort) {
      query['sort'] = sort;
    }

    if (pageCursor) {
      query['page[cursor]'] = pageCursor;
    }

    const response = await klaviyoApiCall({
      apiKey: auth,
      method: HttpMethod.GET,
      resourceUri: '/tags',
      query,
      headers: {
        accept: 'application/vnd.api+json',
        revision: '2025-04-15',
      },
    });

    return response;
  },
});
