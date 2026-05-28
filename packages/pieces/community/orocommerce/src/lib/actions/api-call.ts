import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { tryCatchSync } from '@activepieces/shared';
import { oroAuth, getOroBaseUrl, getAccessToken } from '../common';

export const customApiCallAction = createCustomApiCallAction({
  auth: oroAuth,
  name: 'custom_api_call',
  displayName: 'Custom API Call',
  description: 'Make a direct authenticated call to the OroCommerce JSON:API.',
  baseUrl: (auth) => auth ? getOroBaseUrl({ auth }) : '',
  authMapping: async (auth) => {
    const { data } = tryCatchSync(() => JSON.parse(auth.props.headers ?? '{}') as unknown);
    const connectionHeaders =
      typeof data === 'object' && data !== null && !Array.isArray(data)
        ? Object.fromEntries(Object.entries(data as Record<string, unknown>).map(([k, v]) => [k, String(v)]))
        : {};
    return {
      Authorization: `Bearer ${await getAccessToken({ auth })}`,
      ...connectionHeaders,
    };
  },
  props: {
    headers: {
      defaultValue: {
        'Accept': 'application/vnd.api+json',
        'X-Include': 'noHateoas;totalCount',
      },
    },
  },
});
