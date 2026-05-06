import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { instantlyAuth } from '../auth';
import { instantlyClient } from '../common/client';
import { instantlyProps } from '../common/props';
import { InstantlyCampaign } from '../common/types';

export const getCampaignAction = createAction({
  auth: instantlyAuth,
  name: 'get_campaign',
  displayName: 'Get Campaign',
  description: 'Gets the details of a specific campaign.',
  props: {
    campaign_id: instantlyProps.campaignId(true),
  },
  async run(context) {
    return instantlyClient.makeRequest<InstantlyCampaign>({
      auth: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `campaigns/${context.propsValue.campaign_id}`,
    });
  },
});
