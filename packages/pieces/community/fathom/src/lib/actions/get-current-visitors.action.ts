import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { fathomAuth } from '../..';

export const getCurrentVisitors = createAction({
  name: 'get_current_visitors',
  auth: fathomAuth,
  displayName: 'Get Current Visitors',
  description: 'Get the real-time count of current visitors on a site',
  props: {
    site_id: Property.ShortText({
      displayName: 'Site ID',
      description: 'The ID of the Fathom site (found in your site settings)',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.usefathom.com/v1/sites/${propsValue.site_id}/current_visitors`,
      headers: { Authorization: `Bearer ${auth}` },
    });
    return response.body;
  },
});
