import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const updateDeal = createAction({
  name: 'updateDeal',
  displayName: 'Update Deal',
  description: 'Modify Deal properties in Teamleader.',
  props: {
    id: Property.ShortText({ displayName: 'Deal ID', required: true }),
    title: Property.ShortText({ displayName: 'Title', required: false }),
    value: Property.Number({ displayName: 'Value', required: false }),
    // Add more fields as needed
  },
  async run(context) {
    const { id, title, value } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;
    if (!auth?.access_token) throw new Error('Missing access token');
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.focus.teamleader.eu/deals.update',
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: {
        id,
        ...(title ? { title } : {}),
        ...(value ? { value } : {}),
      },
    });
    return response.body.data;
  },
}); 