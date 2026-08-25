import { createAction } from '@activepieces/pieces-framework';

import { postmarkAuth } from '../auth';
import { DeliveryStatsResponse, postmarkClient } from '../common/client';

export const getDeliveryStats = createAction({
  name: 'get_delivery_stats',
  displayName: 'Get Delivery Stats',
  description: 'Retrieve delivery statistics for the current Postmark server.',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves aggregate delivery statistics for the Postmark server, including bounce-rate breakdowns by type. Use to report on overall email health for the server; it takes no inputs and is scoped to the authenticated server token. Read-only and idempotent.',
    idempotent: true,
  },
  auth: postmarkAuth,
  props: {},
  async run(context) {
    const response = await postmarkClient.get<DeliveryStatsResponse>(
      context.auth.secret_text,
      '/deliverystats'
    );

    return response;
  },
});
