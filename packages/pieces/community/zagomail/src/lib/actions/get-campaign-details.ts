import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { zagomailAuth } from '../../index';

export const getCampaignDetailsAction = createAction({
  auth: zagomailAuth,
  name: 'get_campaign_details',
  displayName: 'Get Campaign Details',
  description: 'Get detailed information about a campaign including stats',
  props: {
    campaignId: Property.ShortText({
      displayName: 'Campaign ID',
      description: 'The ID of the campaign to get details for',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    return await makeRequest(
      auth as string,
      HttpMethod.GET,
      `/campaigns/get-stats?campaign_uid=${propsValue.campaignId}`,
      undefined
    );
  },
});
