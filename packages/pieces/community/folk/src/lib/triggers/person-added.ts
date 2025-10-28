import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { makeFolkRequest, FolkPerson, folkAuth } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const personAddedTrigger = createTrigger({
  auth: folkAuth,
  name: 'person_added',
  displayName: 'Person Added',
  description: 'Triggers when a new person is created or added to a group',
  type: TriggerStrategy.WEBHOOK,
  props: {
    groupId: Property.ShortText({
      displayName: 'Group ID',
      description: 'Only emit if the person belongs to this group (optional)',
      required: false,
    }),
    instructions: Property.MarkDown({
      value: `
## Setup Instructions

1. Copy the webhook URL below
2. Go to Folk Settings → Webhooks
3. Enable webhooks and paste the URL
4. Select event: **Person Created** or **Person Groups Updated**
5. Save the webhook configuration
      `,
    }),
  },
  sampleData: {
    event: 'person.created',
    personId: 'per_123',
    person: {
      id: 'per_123',
      name: 'John Doe',
      email: 'john@example.com',
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
    const allowedEvents = ['person.created', 'person.groups_updated'];
    
    if (!eventType || !allowedEvents.includes(eventType)) return [];

    const data = payload?.data || payload;
    let personFull: any;

    const wantedGroup = context.propsValue?.groupId?.trim();
    if (wantedGroup && personFull?.groups) {
      const groupIds: string[] = Array.isArray(personFull.groups)
        ? personFull.groups.map((g: any) => (typeof g === 'string' ? g : g?.id)).filter(Boolean)
        : [];
      if (!groupIds.includes(wantedGroup)) return [];
    }

    return [{
      event: eventType,
      personId: data?.id,
      personUrl: data?.url,
      person: personFull || data,
    }];
  },
  async test(context) {
    return [{
      event: 'person.created',
      personId: 'per_test123',
      person: { id: 'per_test123', name: 'John Doe', email: 'john@example.com' },
    }];
  },
});