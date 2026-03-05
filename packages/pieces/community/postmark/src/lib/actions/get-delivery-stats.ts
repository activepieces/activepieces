import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { postmarkAuth } from '../auth';
import { postmarkApiRequest } from '../common';

export const getDeliveryStats = createAction({
  auth: postmarkAuth,
  name: 'get_delivery_stats',
  displayName: 'Get Delivery Stats',
  description:
    'Get an overview of inactive emails and bounces for your Postmark server',
  props: {},
  async run(context) {
    return await postmarkApiRequest({
      apiKey: context.auth,
      method: HttpMethod.GET,
      endpoint: '/deliverystats',
    });
  },
});
