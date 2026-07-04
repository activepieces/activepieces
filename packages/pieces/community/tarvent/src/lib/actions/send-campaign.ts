import { createAction } from '@activepieces/pieces-framework';
import { tarventAuth } from '../auth';
import { makeClient, tarventCommon } from '../common';



export const sendCampaign = createAction({
  auth: tarventAuth,
  name: 'tarvent_send_campaign',
  displayName: 'Send Campaign',
  description: 'Sends a copy of a campaign.',
  audience: 'both',
  aiMetadata: { description: 'Triggers Tarvent to send a copy of an existing, fully configured campaign to its audience. Use to dispatch a prepared campaign; the campaign must already have its from address, subject, and content set up. Not idempotent: each call sends the campaign again.', idempotent: false },
  props: {
    campaignId: tarventCommon.campaignId(true, 'Select which campaign to send. **NOTE:** Make sure all campaign settings are correct (from, subject, content) before configuring this automation.', true),
  },
  async run(context) {
    const { campaignId } = context.propsValue;

    const client = makeClient(context.auth);
    return await client.sendCampaignCopy(campaignId);
  },
});
