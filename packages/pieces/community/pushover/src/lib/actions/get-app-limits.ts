import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pushoverAuth } from '../..';
import { pushoverApiCall } from '../common';
import { getAppLimitsOutputSchema } from '../output-schemas';

export const getAppLimits = createAction({
  auth: pushoverAuth,
  name: 'get_app_limits',
  classification: 'READ',
  displayName: 'Get Monthly Message Limits',
  description: 'Read the monthly message allowance and remaining quota of the application',
  audience: 'ai',
  aiMetadata: {
    description:
      'Read the monthly message allowance of the application, how many messages remain, and the Unix timestamp when the counter resets. Use it before a bulk send, or to explain a 429 from Send Push Message, which means the monthly quota is exhausted rather than transient throttling. Takes no input. Safe to retry.',
    idempotent: true,
  },
  props: {},
  outputSchema: getAppLimitsOutputSchema,
  async run({ auth }) {
    return await pushoverApiCall({
      method: HttpMethod.GET,
      resourceUri: '/apps/limits.json',
      queryParams: { token: auth.props.api_token },
    });
  },
});
