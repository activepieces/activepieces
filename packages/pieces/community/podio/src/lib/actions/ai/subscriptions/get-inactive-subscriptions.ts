import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioClient } from '../../../common/client';
import { podioGetInactiveSubscriptionsOutputSchema } from '../../../output-schemas';

export const getInactiveSubscriptionsAction = createAction({
  auth: podioAuth,
  name: 'podio_get_inactive_subscriptions',
  outputSchema: podioGetInactiveSubscriptionsOutputSchema,
  displayName: 'Get Inactive Subscriptions',
  description: 'Lists the workspaces and apps you follow but have not been active in recently.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the connected user\'s Podio subscriptions to workspaces and apps where the user has not been active recently, as candidates to stop with Unsubscribe By Reference.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    const subscriptions = await podioClient.request<unknown[]>({ auth, method: HttpMethod.GET, path: '/subscription/inactive' });
    return { subscriptions, count: subscriptions.length };
  },
});
