import { createAction } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getOrgSubscriptionAction = createAction({
  name: 'get_org_subscription',
  displayName: 'Get Organization Subscription',
  description: 'Retrieve the current subscription for your organization',
  audience: 'both',
  aiMetadata: { description: 'Read the current subscription for the organization tied to the authenticated account (plan, status, billing period). Use this for the org-level subscription; for the individual user use Get User Subscription instead. Read-only and safe to repeat.', idempotent: true },
  auth: zooAuth,
  // category: 'Payments',
  props: {},
  async run({ auth }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.zoo.dev/org/payment/subscriptions',
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
    });
    return response.body;
  },
});
