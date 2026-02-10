import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { fountainAuth } from '../../';
import { getAuthHeaders, getApiUrl } from '../common/auth';
import { getFunnelsDropdown } from '../common/dropdowns';

export const fountainGetOpening = createAction({
  name: 'get_opening',
  auth: fountainAuth,
  displayName: 'Get Opening',
  description: 'Get details for a specific job opening',
  props: {
    id: Property.Dropdown({
      displayName: 'Opening',
      description: 'The opening to retrieve details for',
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
    const openingId = context.propsValue.id;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: getApiUrl(context.auth, `/funnels/${openingId}`),
      headers: getAuthHeaders(context.auth),
    });

    return response.body;
  },
});
