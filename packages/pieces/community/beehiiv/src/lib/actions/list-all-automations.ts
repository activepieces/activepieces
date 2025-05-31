import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { BEEHIIV_API_URL, beehiivAuth, publicationIdProperty } from '../common';

export const listAllAutomations = createAction({
  name: 'list_all_automations',
  displayName: 'List All Automations',
  description: 'Retrieve available automations for user selection or management',
  auth: beehiivAuth,
  props: {
    publication_id: publicationIdProperty,
    limit: Property.Number({
      displayName: 'Limit',
      description: 'The maximum number of automations to return (1-100)',
      required: false,
      defaultValue: 10,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'The page number to return',
      required: false,
      defaultValue: 1,
    }),
  },
  async run({ auth, propsValue }) {
    const { publication_id, limit, page } = propsValue;

    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('limit', limit.toString());
    if (page) queryParams.append('page', page.toString());

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${BEEHIIV_API_URL}/publications/${publication_id}/automations${
        queryParams.toString() ? `?${queryParams.toString()}` : ''
      }`,
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    });

    return response.body;
  },
});
