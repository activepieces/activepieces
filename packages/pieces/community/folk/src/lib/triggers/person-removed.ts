import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { makeFolkRequest, FolkPerson, folkAuth } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const personRemovedTrigger = createTrigger({
  auth: folkAuth,
  name: 'person_removed',
  displayName: 'Person Removed',
  description: 'Triggers when a person is deleted from the workspace or removed from a group',
  type: TriggerStrategy.WEBHOOK,
  props: {
    groupId: Property.ShortText({
      displayName: 'Group ID',
      description: 'Only emit if the person was removed from this group (optional)',
      required: false,
    }),
    instructions: Property.MarkDown({
      value: `
## Setup Instructions

1. Copy the webhook URL below
2. Go to Folk Settings → Webhooks
3. Enable webhooks and paste the URL
4. Select event: **Person Deleted** or **Person Groups Updated**
5. Save the webhook configuration
      `,
    }),
  },
  sampleData: {
    event: 'person.deleted',
    personId: 'per_123',
    deletedAt: new Date().toISOString(),
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
    const allowedEvents = ['person.deleted', 'person.groups_updated'];
    
    if (!eventType || !allowedEvents.includes(eventType)) return [];

    const data = payload?.data || payload;

    if (eventType === 'person.groups_updated') {
      const removedGroups = data?.changes?.groups?.removed || [];
      const wantedGroup = context.propsValue?.groupId?.trim();
      
      if (wantedGroup && !removedGroups.includes(wantedGroup)) return [];
    }

    return [{
      event: eventType,
      personId: data?.id,
      personUrl: data?.url,
      changes: data?.changes,
      deletedAt: new Date().toISOString(),
    }];
  },
  async test(context) {
    return [{
      event: 'person.deleted',
      personId: 'per_test123',
      deletedAt: new Date().toISOString(),
    }];
  },
});