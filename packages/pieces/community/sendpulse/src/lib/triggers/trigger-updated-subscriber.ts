import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { sendPulseAuth } from '../common/auth';
import { mailingListId } from '../common/props';
import { Property } from '@activepieces/pieces-framework';

export const updatedSubscriberTrigger = createTrigger({
  name: 'updated_subscriber',
  displayName: 'Updated Subscriber',
  description: 'Fires when one or more subscribers are updated in a mailing list.',
  auth: sendPulseAuth,
  props: {
    addressBookId: mailingListId,
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const { addressBookId } = context.propsValue;
    await context.store.put('sendpulse-subscriber-update-list-id', String(addressBookId));
  },
  async onDisable(context) {
    await context.store.delete('sendpulse-subscriber-update-list-id');
  },
  async run(context) {
    const storedListId = await context.store.get('sendpulse-subscriber-update-list-id');
    const payload = context.payload.body;
    const now = new Date().toISOString();
    const items = Array.isArray(payload) ? payload : [payload];
    const seen = new Set();
    const normalized = [];
    for (const item of items) {
      if (!item) continue;
      const incomingListId = item.addressbook_id ?? item.book_id ?? item.addressBookId ?? item.address_book_id;
      if (storedListId && String(incomingListId) !== String(storedListId)) continue;
      const id = item.email || item.phone || now;
      if (seen.has(id)) continue;
      seen.add(id);
      const updatedAt = item.timestamp ? new Date(Number(item.timestamp) * 1000).toISOString() : now;
      normalized.push({
        id,
        email: item.email || null,
        phone: item.phone || null,
        addressBookId: incomingListId,
        updatedAt,
        changes: item,
      });
    }
    return normalized;
  },
  async test() {
    const now = new Date().toISOString();
    return [
      {
        id: 'test-updated@example.com',
        email: 'test-updated@example.com',
        phone: '+1234567890',
        addressBookId: 123456,
        updatedAt: now,
        changes: {
          email: 'test-updated@example.com',
          phone: '+1234567890',
          addressbook_id: 123456,
          event: 'subscriber_updated',
        },
      },
      {
        id: '+1234567890',
        email: null,
        phone: '+1234567890',
        addressBookId: 123456,
        updatedAt: now,
        changes: {
          phone: '+1234567890',
          addressbook_id: 123456,
          event: 'subscriber_updated',
          variables: { first_name: 'UpdatedName' },
        },
      },
    ];
  },
  sampleData: {
    id: 'updated-user@example.com',
    email: 'updated-user@example.com',
    phone: '+19876543210',
    addressBookId: 123456,
    updatedAt: '2025-07-13T12:00:00.000Z',
    changes: {
      email: 'updated-user@example.com',
      phone: '+19876543210',
      addressbook_id: 123456,
      event: 'subscriber_updated',
      variables: {
        first_name: 'UpdatedName',
      },
    },
  },
}); 