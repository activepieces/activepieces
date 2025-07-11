import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callClickSendApi } from '../common';
import { clicksendAuth } from '../..';

export const clicksendSearchContactLists = createAction({
  auth: clicksendAuth,
  name: 'search_contact_lists',
  description: 'Get all contact lists',
  displayName: 'Search Contact Lists',
  props: {
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number to return',
      required: false,
      defaultValue: 1,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of results per page (min 15, max 100)',
      required: false,
      defaultValue: 15,
    }),
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Search by list name',
      required: false,
    }),
  },
  async run(context) {
    const { page, limit, search } = context.propsValue;
    const username = context.auth.username;
    const password = context.auth.password;
    let url = `lists?page=${page || 1}&limit=${limit || 15}`;
    if (search) {
      url += `&q=${encodeURIComponent(search)}`;
    }
    try {
      return await callClickSendApi(
        HttpMethod.GET,
        url,
        { username, password }
      );
    } catch (error) {
      throw error;
    }
  },
}); 