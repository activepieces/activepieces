import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth, VILLAGE_API_BASE_URL } from '../../common/auth';

export const listIntegrations = createAction({
  auth: villageAuth,
  name: 'list_integrations',
  displayName: 'List Gmail Integrations',
  description:
    'Get all your connected Gmail integrations, including rate limits, timezone, the default sending account, and whether you can add more based on your plan.',
  props: {},
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${VILLAGE_API_BASE_URL}/v2/integrations`,
      headers: { Authorization: `Bearer ${context.auth}` },
    });
    return response.body;
  },
});
