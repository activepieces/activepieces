import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { MailchimpClient } from '../common/types';

export const sendCampaign = createAction({
  auth: mailchimpAuth,
  name: 'send_campaign',
  classification: 'WRITE',
  displayName: 'Send Campaign',
  description: 'Send a draft campaign to its recipients',
  audience: 'both',
  aiMetadata: { description: 'Sends an existing draft campaign to its configured recipients immediately (RSS campaigns follow their schedule instead). Use once the campaign is fully set up; there is no undo, so confirm the campaign content and audience beforehand. Not idempotent: calling again on an already-sent campaign fails.', idempotent: false },
  propertyGroups: [
    {
      key: 'campaign',
      display: 'section',
      label: 'Campaign to Send',
      icon: 'send',
      props: ['send_info', 'campaign_id'],
    },
  ],
  props: {
    send_info: Property.MarkDown({
      value: 'The campaign goes out right away and cannot be unsent.',
      variant: MarkdownVariant.INFO,
    }),
    campaign_id: mailchimpCommon.mailChimpDraftCampaignIdDropdown,
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
