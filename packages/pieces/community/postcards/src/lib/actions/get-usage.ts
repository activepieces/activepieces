import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { postcardsAuth, POSTCARDS_BASE_URL } from '../auth';

export const getUsage = createAction({
  auth: postcardsAuth,
  name: 'get_usage',
  displayName: 'Get Usage',
  description:
    "Get the current export quota usage and active plan for the authenticated team. Returns plan name/period and exports used/limit (unlimited on Pro and Agency).",
  props: {},
  async run(context) {
    const res = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${POSTCARDS_BASE_URL}/api/v1/usage`,
      headers: { Authorization: `Bearer ${context.auth.secret_text}` },
    });
    return res.body;
  },
});
