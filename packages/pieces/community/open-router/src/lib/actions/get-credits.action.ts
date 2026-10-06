import { createAction } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { openRouterAuth } from '../auth';
import { getCreditsActionOutputSchema } from '../output-schemas';

interface OpenRouterCreditsResponse {
  data: {
    total_credits: number;
    total_usage: number;
  };
}

export const getCreditsAction = createAction({
  audience: 'both',
  name: 'get_credits',
  classification: 'READ',
  auth: openRouterAuth,
  displayName: 'Get Credits',
  description: "Gets this account's current API credit balance and total usage.",
  aiMetadata: {
    description:
      "Returns the total credits purchased and total credits used on this OpenRouter account. Call it before a large or batched job to confirm there is enough balance left; a low or exhausted balance makes every paid model generation fail. Safe to retry: read-only.",
    idempotent: true,
  },
  props: {},
  outputSchema: getCreditsActionOutputSchema,
  async run({ auth }) {
    const response = await httpClient.sendRequest<OpenRouterCreditsResponse>({
      url: 'https://openrouter.ai/api/v1/credits',
      method: HttpMethod.GET,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.secret_text,
      },
    });

    return {
      totalCredits: response.body.data.total_credits,
      totalUsage: response.body.data.total_usage,
    };
  },
});
