import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth, VILLAGE_API_BASE_URL } from '../../common/auth';

export const getAppInfo = createAction({
  auth: villageAuth,
  name: 'get_app_info',
  displayName: 'Get App Information',
  description:
    'Get information about the partner application associated with your token — title, description, domain, logo URL, public key, and active flag. Useful for verifying your app configuration.',
  props: {},
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${VILLAGE_API_BASE_URL}/v2/app`,
      headers: { Authorization: `Bearer ${context.auth.secret_text}` },
    });
    return response.body;
  },
});
