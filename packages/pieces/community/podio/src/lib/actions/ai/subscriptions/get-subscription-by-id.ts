import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetSubscriptionByIdOutputSchema } from '../../../output-schemas';

export const getSubscriptionByIdAction = createAction({
  auth: podioAuth,
  name: 'podio_get_subscription_by_id',
  outputSchema: podioGetSubscriptionByIdOutputSchema,
  displayName: 'Get Subscription By ID',
  description: 'Gets one subscription by its id.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads one Podio subscription by id: the object it follows, when it started and how many notifications it produced. The subscription id comes from Subscribe; to look one up by object use Get Subscription By Reference.',
    idempotent: true,
  },
  props: {
    subscriptionId: podioAiProps.id({ required: true, displayName: 'Subscription ID', description: 'The id of the subscription, from Subscribe.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/subscription/${propsValue.subscriptionId}` });
  },
});
