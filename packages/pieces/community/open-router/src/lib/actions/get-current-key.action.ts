import { createAction } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { openRouterAuth } from '../auth';
import { getCurrentKeyActionOutputSchema } from '../output-schemas';

interface OpenRouterKeyResponse {
  data: {
    label: string;
    usage: number;
    limit: number | null;
    is_free_tier: boolean;
    rate_limit: {
      requests: number;
      interval: string;
    };
  };
}

export const getCurrentKeyAction = createAction({
  audience: 'both',
  name: 'get_current_key',
  classification: 'READ',
  auth: openRouterAuth,
  displayName: 'Get API Key Usage',
  description: 'Gets usage, spend limit, and rate-limit info for your connected API key.',
  aiMetadata: {
    description:
      "Returns metadata for the connected OpenRouter API key: its label, usage so far, spend limit if one is set, whether it is free-tier, and its rate limit. Use it to check remaining headroom before a batch of generations. Safe to retry: read-only.",
    idempotent: true,
  },
  props: {},
  outputSchema: getCurrentKeyActionOutputSchema,
  async run({ auth }) {
    const response = await httpClient.sendRequest<OpenRouterKeyResponse>({
      url: 'https://openrouter.ai/api/v1/key',
      method: HttpMethod.GET,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.secret_text,
      },
    });

    const { label, usage, limit, is_free_tier, rate_limit } = response.body.data;

    return {
      label,
      usage,
      limit,
      isFreeTier: is_free_tier,
      rateLimit: {
        requests: rate_limit?.requests ?? null,
        interval: rate_limit?.interval ?? null,
      },
    };
  },
});
