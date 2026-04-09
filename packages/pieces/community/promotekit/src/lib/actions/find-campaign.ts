import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { promotekitAuth } from '../..';
import { promotekitApiCall } from '../common';

export const findCampaign = createAction({
  auth: promotekitAuth,
  name: 'find_campaign',
  displayName: 'Find Campaign',
  description: 'Get details of a specific campaign by ID.',
  props: {
    campaign_id: Property.ShortText({
      displayName: 'Campaign ID',
      description: 'The ID of the campaign to retrieve.',
      required: true,
    }),
  },
  async run(context) {
    const response = await promotekitApiCall<{
      data: Record<string, unknown>;
    }>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/campaigns/${context.propsValue.campaign_id}`,
    });
    const campaign = response.body.data;
    return {
      id: campaign['id'],
      name: campaign['name'],
      commission_type: campaign['commission_type'] ?? null,
      commission_amount: campaign['commission_amount'] ?? null,
    };
  },
});
