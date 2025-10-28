import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { makeFolkRequest, folkAuth, FolkCompany } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const companyAddedTrigger = createTrigger({
  auth: folkAuth,
  name: 'company_added',
  displayName: 'Company Added',
  description: 'Triggers when a new company is created or added to a group',
  type: TriggerStrategy.WEBHOOK,
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
4. Select event: **Company Created** or **Company Groups Updated**
5. Save the webhook configuration
      `,
    }),
  },
  sampleData: {
    event: 'company.created',
    companyId: 'com_123',
    company: {
      id: 'com_123',
      name: 'Sample Company',
      groups: ['grp_456'],
    },
  },
  async onEnable(context) {
    await context.store.put('webhookUrl', context.webhookUrl);
  },
  async onDisable(context) {
    await context.store.delete('webhookUrl');
  },
  async run(context) {
    const payload: any = context.payload?.body;
    if (!payload) return [];

    const eventType = payload?.type || payload?.event;
    const allowedEvents = ['company.created', 'company.groups_updated'];
    
    if (!eventType || !allowedEvents.includes(eventType)) return [];

    const data = payload?.data || payload;
    let companyFull: any;

    const wantedGroup = context.propsValue?.groupId?.trim();
    if (wantedGroup && companyFull?.groups) {
      const groupIds: string[] = Array.isArray(companyFull.groups)
        ? companyFull.groups.map((g: any) => (typeof g === 'string' ? g : g?.id)).filter(Boolean)
        : [];
      if (!groupIds.includes(wantedGroup)) return [];
    }

    return [{
      event: eventType,
      companyId: data?.id,
      companyUrl: data?.url,
      company: companyFull || data,
    }];
  },
  async test(context) {
    return [{
      event: 'company.created',
      companyId: 'com_test123',
      company: { id: 'com_test123', name: 'Test Company' },
    }];
  },
});