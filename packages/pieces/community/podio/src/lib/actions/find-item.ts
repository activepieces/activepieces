import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { podioAuth } from '../../index';
import { podioApiCall } from '../common/client';
import { appIdDropdown } from '../common/props';
import { PodioItem } from '../common/types';

export const findItemAction = createAction({
  name: 'find_item',
  displayName: 'Find Item',
  description: 'Searches for items in a Podio app.',
  auth: podioAuth,
  props: {
    appId: appIdDropdown('App', true),
    searchTerm: Property.ShortText({
      displayName: 'Search Term',
      description: 'Text to search for in items',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of items to return (default: 10)',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const appId = context.propsValue.appId;
    const searchTerm = context.propsValue.searchTerm;
    const limit = context.propsValue.limit || 10;

    if (!appId) {
      throw new Error('App ID is required.');
    }

    const query: Record<string, any> = {
      limit,
    };

    if (searchTerm) {
      query['query'] = searchTerm;
    }

    // https://developers.podio.com/doc/items/filter-items-4496747
    const response = await podioApiCall<{ items: PodioItem[] }>({
      auth: context.auth,
      method: HttpMethod.POST,
      resourceUri: `/item/app/${appId}/filter/`,
      body: {
        limit,
        ...(searchTerm && { query: searchTerm }),
      },
    });

    return response.items || [];
  },
});