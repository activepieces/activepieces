import { emailoctopusAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { TriggerStrategy, createTrigger, Property } from '@activepieces/pieces-framework';
import { emailoctopusCommon } from '../common/client';

export const emailBounced = createTrigger({
  name: 'email_bounced',
  displayName: 'Email Bounced',
  description: 'Fires when an email to a recipient bounces from a specific campaign',
  auth: emailoctopusAuth,
  type: TriggerStrategy.WEBHOOK,
  props: {
    campaign_id: Property.ShortText({
      displayName: 'Campaign ID',
      description: 'The ID of the campaign to monitor for bounced emails',
      required: true,
    }),
  },
  sampleData: {
    campaign_id: '00000000-0000-0000-0000-000000000000',
    contact_id: '00000000-0000-0000-0000-000000000000',
    email_address: 'john.doe@example.com',
    bounced_at: '2023-07-27T10:00:00+00:00',
    bounce_reason: 'Mailbox full',
    bounce_type: 'soft'
  },

  onEnable: async (context) => {
    const webhookUrl = context.webhookUrl;
    const campaignId = context.propsValue.campaign_id;

    const response = await emailoctopusCommon.apiCall({
      auth: context.auth,
      method: HttpMethod.POST,
      resourceUri: '/webhooks',
      body: {
        url: webhookUrl,
        events: ['email.bounced'],
        campaign_id: campaignId
      }
    });

    await context.store.put('webhookId', response.body.id);
  },

  onDisable: async (context) => {
    const webhookId = await context.store.get('webhookId');
    if (webhookId) {
      await emailoctopusCommon.apiCall({
        auth: context.auth,
        method: HttpMethod.DELETE,
        resourceUri: `/webhooks/${webhookId}`,
      });
    }
  },

  run: async (context) => {
    const payload = context.payload.body as any;
    return [payload];
  },
});
