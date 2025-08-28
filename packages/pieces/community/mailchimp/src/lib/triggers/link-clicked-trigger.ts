import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../auth';

export const mailChimpLinkClickedTrigger = createTrigger({
  auth: mailchimpAuth,
  name: 'link_clicked',
  displayName: 'Link Clicked',
  description: 'Fires when a recipient clicks a specified link in a campaign.',
  type: TriggerStrategy.POLLING,
  props: {
    campaign_id: mailchimpCommon.mailChimpCampaignIdDropdown,
  },
  sampleData: {
    id: 'click123',
    campaign_id: '42694e9e57',
    list_id: 'a6b5da1054',
    email_id: 'subscriber123',
    email_address: 'user@example.com',
    url: 'https://example.com/link',
    timestamp: '2009-03-26T21:35:57+00:00',
    ip: '192.168.1.1',
  },

  async onEnable(context): Promise<void> {
    // Store the last check timestamp
    await context.store?.put('last_check', new Date().toISOString());
  },

  async onDisable(context): Promise<void> {
    // Clean up stored data
    await context.store?.delete('last_check');
  },

  async run(context): Promise<unknown[]> {
    const lastCheck = await context.store?.get<string>('last_check');
    const campaignId = context.propsValue.campaign_id!;

    try {
      const response = await mailchimpCommon.makeApiRequest(
        context.auth,
        `/reports/${campaignId}/click-details`
      );

      const clicks = response.body.clicks || [];
      const newClicks = lastCheck 
        ? clicks.filter((click: any) => new Date(click.timestamp) > new Date(lastCheck))
        : clicks;

      // Update last check timestamp
      await context.store?.put('last_check', new Date().toISOString());

      return newClicks;
    } catch (error) {
      console.error('Error fetching click details:', error);
      return [];
    }
  },
});
