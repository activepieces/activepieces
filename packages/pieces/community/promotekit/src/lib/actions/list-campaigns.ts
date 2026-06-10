import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { promotekitAuth } from '../..';
import { promotekitApiCall } from '../common';

export const listCampaigns = createAction({
  auth: promotekitAuth,
  name: 'list_campaigns',
  displayName: 'List Campaigns',
  description: 'List all campaigns in your PromoteKit account.',
  props: {},
  async run(context) {
    const response = await promotekitApiCall<{
      data: Array<Record<string, unknown>>;
    }>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/campaigns',
      queryParams: { limit: '100' },
    });
    return response.body.data.map((campaign) => ({
      id: campaign['id'],
      name: campaign['name'],
      commission_type: campaign['commission_type'] ?? null,
      commission_amount: campaign['commission_amount'] ?? null,
    }));
  },
});
