import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const searchDeals = createAction({
  name: 'searchDeals',
  displayName: 'Search Deals',
  description: 'List or filter Deals via Teamleader API.',
  props: {
    title: Property.ShortText({ displayName: 'Title (filter)', required: false }),
    status: Property.ShortText({ displayName: 'Status (filter)', required: false }),
    pageSize: Property.Number({ displayName: 'Page Size', required: false, defaultValue: 50 }),
  },
  async run(context) {
    const { title, status, pageSize } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;
    if (!auth?.access_token) throw new Error('Missing access token');
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.focus.teamleader.eu/deals.list',
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: {
        filter: {
          ...(title ? { title } : {}),
          ...(status ? { status } : {}),
        },
        page: { size: pageSize || 50 },
      },
    });
    return response.body.data;
  },
}); 