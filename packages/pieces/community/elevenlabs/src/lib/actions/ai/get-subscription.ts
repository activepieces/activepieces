import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsGetSubscriptionOutputSchema } from '../../output-schemas';

export const getSubscription = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_get_subscription',
  outputSchema: elevenlabsGetSubscriptionOutputSchema,
  displayName: 'Get Subscription',
  description: 'Get the account subscription and usage',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns the subscription tier and usage: characters used and remaining, voice slots, and the reset date. Use to check remaining credits before large generations.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.GET,
      path: `/v1/user/subscription`,
    });
    return response ?? { success: true };
  },
});
