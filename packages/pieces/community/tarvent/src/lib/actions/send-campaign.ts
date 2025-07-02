import { createAction } from '@activepieces/pieces-framework';
import { tarventAuth } from '../..';
import { makeClient, tarventCommon } from '../common';



export const sendCampaign = createAction({
  auth: tarventAuth,
  name: 'tarvent_send_campaign',
  displayName: 'Send Campaign',
  description: 'Sends a copy of a campaign.',
  props: {
    campaignId: tarventCommon.campaignId(true, 'Select which campaign to send. **NOTE:** Make sure all campaign settings are correct (from, subject, content) before configuring this automation.', true),
  },
  async run(context) {
    const { campaignId } = context.propsValue;

    const client = makeClient(context.auth);
    return await client.sendCampaignCopy(campaignId);
  },
});
