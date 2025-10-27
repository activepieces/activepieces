import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { makeFolkRequest, folkAuth } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const companyAddedTrigger = createTrigger({
  auth: folkAuth,
  name: 'company_added',
  displayName: 'Company Added',
  description: 'Fires when a company is created or its groups change (when enabled in Folk Settings)',
  props: {
    groupId: Property.ShortText({
      displayName: 'Group ID',
      description: 'Only emit if the company belongs to this group (optional)',
      required: false,
    }),
    instructions: Property.MarkDown({
      value: `
## Setup Instructions

1. Copy the webhook URL below
2. Go to Folk Settings → Webhooks
3. Enable webhooks and paste the URL
4. Select the events you want to monitor:
   - Company Created
   - Company Groups Updated
5. Save the webhook configuration

The trigger will now fire when companies are added or their groups change.
      `,
    }),
  },
  type: TriggerStrategy.WEBHOOK,

  sampleData: {
    event: 'company.created',
    companyId: 'com_123',
    companyUrl: 'https://api.folk.app/v1/companies/com_123',
    company: {
      id: 'com_123',
      name: 'Sample Company',
      groups: ['grp_456'],
    },
  },

  async onEnable(context) {
    // Store webhook URL for reference
    await context.store.put('webhookUrl', context.webhookUrl);
    if (context.propsValue.groupId) {
      await context.store.put('groupId', context.propsValue.groupId);
    }
  },

  async onDisable(context) {
    await context.store.delete('webhookUrl');
    await context.store.delete('groupId');
  },

  async run(context) {
    // Get the payload from Folk
    const payload: any = context.payload?.body;
    
    if (!payload) {
      console.log('No payload received');
      return [];
    }

    console.log('Received payload:', JSON.stringify(payload));

    // Folk webhook payload structure
    const eventType = payload?.type || payload?.event;
    const data = payload?.data || payload;

    // Check if this is a company event
    const allowedEvents = ['company.created', 'company.groups_updated'];
    if (!eventType || !allowedEvents.includes(eventType)) {
      console.log('Event type not allowed:', eventType);
      return [];
    }

    let companyFull: any | undefined;

    // Apply group filter if specified
    const wantedGroup = context.propsValue?.groupId?.trim();
    if (wantedGroup && companyFull?.groups) {
      const groupIds: string[] = Array.isArray(companyFull.groups)
        ? companyFull.groups.map((g: any) => (typeof g === 'string' ? g : g?.id)).filter(Boolean)
        : [];
      
      if (!groupIds.includes(wantedGroup)) {
        console.log('Company does not belong to specified group');
        return [];
      }
    }

    // Return the data in the correct format (array of records)
    return [{
      event: eventType,
      companyId: data?.id,
      companyUrl: data?.url,
      changes: data?.changes,
      company: companyFull || data, // Full company data or thin payload
    }];
  },

  async test(context) {
    // Return sample data for testing
    return [{
      event: 'company.created',
      companyId: 'com_test123',
      companyUrl: 'https://api.folk.app/v1/companies/com_test123',
      company: {
        id: 'com_test123',
        name: 'Test Company',
        groups: ['grp_456'],
        createdAt: new Date().toISOString(),
      },
    }];
  },
});