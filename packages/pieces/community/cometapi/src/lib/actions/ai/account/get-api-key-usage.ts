import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiClient } from '../../../common/client';
import { cometapiGetApiKeyUsageOutputSchema } from '../../../output-schemas';

export const getApiKeyUsageAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_get_api_key_usage',
  outputSchema: cometapiGetApiKeyUsageOutputSchema,
  displayName: 'Get API Key Usage',
  description: 'Returns the quota, usage and expiry of the connected API key.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      "Returns the connected API key's granted, used and available quota (in CometAPI quota units), whether it is unlimited, its model restrictions and expiry. Use it before costly generation to check the key can pay; the organization balance is not included. Free to call.",
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    const response = await cometApiClient.request<{
      code: boolean;
      message: string;
      data: Record<string, unknown>;
    }>({
      auth,
      method: HttpMethod.GET,
      host: 'root',
      path: '/api/usage/token',
    });
    if (!response.code) {
      throw new Error(
        `CometAPI could not read the key usage: ${response.message}`
      );
    }
    return response.data;
  },
});
