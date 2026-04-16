import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { moosendAuth } from '../common/auth';
import { moosendApiCall } from '../common/client';

export const getCampaignStatistics = createAction({
  auth: moosendAuth,
  name: 'get_campaign_statistics',
  displayName: 'Get Campaign Statistics',
  description: 'Get performance statistics for a Moosend campaign.',
  props: {
    campaign_id: Property.ShortText({
      displayName: 'Campaign ID',
      description: 'The ID of the campaign.',
      required: true,
    }),
  },
  async run(context) {
    const response = await moosendApiCall<{ Context: Record<string, unknown> }>({
      method: HttpMethod.GET,
      path: `campaigns/${context.propsValue.campaign_id}/view.json`,
      auth: context.auth,
    });

    return response.body.Context;
  },
});
