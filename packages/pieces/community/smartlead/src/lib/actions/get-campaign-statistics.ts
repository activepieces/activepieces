import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { smartleadRequest } from '../common/client';
import { smartleadAuth } from '../auth';

export const getCampaignStatisticsAction = createAction({
  auth: smartleadAuth,
  name: 'get_campaign_statistics',
  displayName: 'Get Campaign Statistics',
  description:
    'Retrieve comprehensive analytics for a campaign including open rates, click rates, reply rates, and engagement statistics.',
  props: {
    campaign_id: Property.Number({
      displayName: 'Campaign ID',
      description: 'The ID of the campaign to get statistics for',
      required: true,
    }),
  },
  async run(context) {
    const { campaign_id } = context.propsValue;
    const apiKey = context.auth.secret_text;

    return await smartleadRequest({
      endpoint: `campaigns/${campaign_id}/analytics`,
      method: HttpMethod.GET,
      apiKey,
    });
  },
});
