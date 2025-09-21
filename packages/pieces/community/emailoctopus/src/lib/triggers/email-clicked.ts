import { emailoctopusAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { TriggerStrategy, createTrigger, Property } from '@activepieces/pieces-framework';
import { emailoctopusCommon } from '../common/client';

export const emailClicked = createTrigger({
  name: 'email_clicked',
  displayName: 'Email Clicked',
  description: 'Fires when a link inside a specific campaign email is clicked',
  auth: emailoctopusAuth,
  type: TriggerStrategy.WEBHOOK,
  props: {
    campaign_id: Property.ShortText({
      displayName: 'Campaign ID',
      description: 'The ID of the campaign to monitor for clicked links',
      required: true,
    }),
  },
  sampleData: {
    campaign_id: '00000000-0000-0000-0000-000000000000',
    contact_id: '00000000-0000-0000-0000-000000000000',
    email_address: 'john.doe@example.com',
    clicked_at: '2023-07-27T10:00:00+00:00',
    url: 'https://example.com/link',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    ip_address: '192.168.1.1'
  },

  onEnable: async (context) => {
    const webhookUrl = context.webhookUrl;
    const campaignId = context.propsValue.campaign_id;

    await emailoctopusCommon.apiCall({
      auth: context.auth,
      method: HttpMethod.POST,
      resourceUri: '/webhooks',
      body: {
        url: webhookUrl,
        events: ['email.clicked'],
        campaign_id: campaignId
      }
    });
  },

  onDisable: async (context) => {
  },

  run: async (context) => {
    const payload = context.payload.body as any;
    return [payload];
  },
});
