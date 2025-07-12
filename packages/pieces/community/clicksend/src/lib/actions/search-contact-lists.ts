import { createAction, Property } from '@activepieces/pieces-framework';
import { clicksendAuth } from '../../index';
import { makeRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const searchContactLists = createAction({
  auth: clicksendAuth,
  name: 'searchContactLists',
  displayName: 'Search Lists by Name',
  description: 'Search for contact lists by name in ClickSend',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Enter the name or keyword to search for in contact lists',
      required: true,
    }),
    page: Property.Number({
      displayName: 'Page Number',
      description: 'Page number for pagination (default: 1)',
      required: false,
      defaultValue: 1,
    }),
    limit: Property.Number({
      displayName: 'Records per Page',
      description: 'Number of records per page (default: 50, max: 100)',
      required: false,
      defaultValue: 50,
    }),
  },
  async run({ auth, propsValue }) {
    const { username, password } = auth;
    const apiKey = `${username}:${password}`;

    // Search for contact lists by name
    const queryParams: Record<string, any> = {
      q: propsValue.query,
    };
    
    if (propsValue['page']) {
      queryParams['page'] = propsValue['page'];
    }
    if (propsValue['limit']) {
      queryParams['limit'] = propsValue['limit'];
    }

    const response = await makeRequest(
      apiKey,
      HttpMethod.GET,
      '/search/contacts-lists',
      queryParams
    );

    // Ensure response.data is an array
    const lists = Array.isArray(response.data.data) ? response.data.data : [];

    return {
      success: true,
      message: `Found ${lists.length} contact list(s) matching "${propsValue.query}"`,
      search_query: propsValue.query,
      total_lists: lists.length,
      lists: lists,
      pagination: {
        page: propsValue['page'] || 1,
        limit: propsValue['limit'] || 50,
      },
    };
  },
});
