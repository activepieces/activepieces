import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';

export const mailChimpEmailOpenedTrigger = createTrigger({
  auth: mailchimpAuth,
  name: 'email_opened',
  displayName: 'Email Opened',
  description: 'Fires when a recipient opens an email in a specific campaign.',
  type: TriggerStrategy.POLLING,
  props: {
    campaign_id: mailchimpCommon.mailChimpCampaignIdDropdown,
  },
  sampleData: {
    id: 'open123',
    campaign_id: '42694e9e57',
    list_id: 'a6b5da1054',
    email_id: 'subscriber123',
    email_address: 'user@example.com',
    timestamp: '2009-03-26T21:35:57+00:00',
    ip: '192.168.1.1',
  },

  async onEnable(context): Promise<void> {
    await context.store?.put('last_check', new Date().toISOString());
  },

  async onDisable(context): Promise<void> {
    await context.store?.delete('last_check');
  },

  async run(context): Promise<unknown[]> {
    const lastCheck = await context.store?.get<string>('last_check');
    const campaignId = context.propsValue.campaign_id!;

    try {
      const response = await mailchimpCommon.makeApiRequest(
        context.auth,
        `/reports/${campaignId}/open-details`
      );

      const opens = response.body.opens || [];
      const newOpens = lastCheck 
        ? opens.filter((open: any) => new Date(open.timestamp) > new Date(lastCheck))
        : opens;

      await context.store?.put('last_check', new Date().toISOString());

      return newOpens;
    } catch (error) {
      console.error('Error fetching open details:', error);
      return [];
    }
  },
});
