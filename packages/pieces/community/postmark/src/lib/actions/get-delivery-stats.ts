import { createAction } from '@activepieces/pieces-framework';

import { postmarkAuth } from '../auth';
import { DeliveryStatsResponse, postmarkClient } from '../common/client';

export const getDeliveryStats = createAction({
  name: 'get_delivery_stats',
  displayName: 'Get Delivery Stats',
  description: 'Retrieve delivery statistics for the current Postmark server.',
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
