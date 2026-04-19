import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { fathomAuth } from '../..';

export const listSites = createAction({
  name: 'list_sites',
  auth: fathomAuth,
  displayName: 'List Sites',
  description: 'Retrieve all sites in your Fathom Analytics account',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of sites to return (default 10, max 100)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const params: Record<string, string> = {};
    if (propsValue.limit) params['limit'] = String(propsValue.limit);

    const url = Object.keys(params).length
      ? `https://api.usefathom.com/v1/sites?${new URLSearchParams(params).toString()}`
      : 'https://api.usefathom.com/v1/sites';

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url,
      headers: { Authorization: `Bearer ${auth}` },
    });
    return response.body;
  },
});
