import { createAction, Property } from '@activepieces/pieces-framework';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';

export const getCampaignReport = createAction({
  auth: mailchimpAuth,
  name: 'get_campaign_report',
  displayName: 'Get Campaign Report',
  description: 'Get detailed report for a specific campaign',
  props: {
    campaign_id: mailchimpCommon.mailChimpCampaignIdDropdown,
  },
  async run(context) {
    try {
      const response = await mailchimpCommon.makeApiRequest(
        context.auth,
        `/reports/${context.propsValue.campaign_id}`
      );

      return response.body;
    } catch (error) {
      throw new Error(`Failed to get campaign report: ${JSON.stringify(error)}`);
    }
  },
});
