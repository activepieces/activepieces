import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { fountainAuth } from '../../';
import { getAuthHeaders, getApiUrl } from '../common/auth';
import { getFunnelsDropdown } from '../common/dropdowns';

export const fountainListStages = createAction({
  name: 'list_stages',
  auth: fountainAuth,
  displayName: 'List All Stages',
  description: 'Retrieves an Opening\'s stages',
  props: {
    funnel_id: Property.Dropdown({
      displayName: 'Opening',
      description: 'The opening to get stages for',
      required: true,
      refreshers: [],
      auth: fountainAuth,
        options: async ({ auth }) => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Connect account first' };
        return { disabled: false, options: await getFunnelsDropdown(auth) };
      },
    }),
  },
  async run(context) {
    const funnelId = context.propsValue.funnel_id;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: getApiUrl(context.auth, `/funnels/${funnelId}/stages`),
      headers: getAuthHeaders(context.auth),
    });

    return response.body;
  },
});
