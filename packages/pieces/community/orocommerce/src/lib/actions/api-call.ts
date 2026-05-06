import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { oroAuth, getOroBaseUrl, getAccessToken } from '../common';

export const customApiCallAction = createCustomApiCallAction({
  auth: oroAuth,
  name: 'custom_api_call',
  displayName: 'Custom API Call',
  description: 'Make a direct authenticated call to the OroCommerce JSON:API.',
  baseUrl: (auth) => auth ? getOroBaseUrl({ auth }) : '',
  authMapping: async (auth) => ({
    Authorization: `Bearer ${await getAccessToken({ auth })}`,
    'Content-Type': 'application/vnd.api+json',
  }),
  props: {
    headers: {
      defaultValue: {
        'Accept': 'application/vnd.api+json',
        'X-Include': 'noHateoas;totalCount',
      },
    },
  },
});
