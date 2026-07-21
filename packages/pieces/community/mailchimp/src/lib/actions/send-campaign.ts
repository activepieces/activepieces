import { createAction } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { MailchimpClient } from '../common/types';

export const sendCampaign = createAction({
  auth: mailchimpAuth,
  name: 'send_campaign',
  displayName: 'Send Campaign',
  description: 'Send a draft campaign to the subscribers in its audience, segment, or tag',
  audience: 'both',
  aiMetadata: { description: 'Sends an existing draft campaign to its configured recipients immediately (RSS campaigns follow their schedule instead). Use once the campaign is fully set up; there is no undo, so confirm the campaign content and audience beforehand. Not idempotent: calling again on an already-sent campaign fails.', idempotent: false },
  props: {
    campaign_id: mailchimpCommon.mailChimpCampaignIdDropdown,
  },
  async run(context) {
    const { campaign_id } = context.propsValue;
    const accessToken = getAccessTokenOrThrow(context.auth);
    const server = await mailchimpCommon.getMailChimpServerPrefix(accessToken);

    const client = mailchimp as unknown as MailchimpClient;
    client.setConfig({
      accessToken: accessToken,
      server: server,
    });

    try {
      // Docs: https://mailchimp.com/developer/marketing/api/campaigns/send-campaign/
      await client.campaigns.send(campaign_id as string);

      return {
        success: true,
        message: 'Campaign sent successfully',
        campaign_id,
      };
    } catch (error: any) {
      throw new Error(`Failed to send campaign: ${error.message || JSON.stringify(error)}`);
    }
  },
});
