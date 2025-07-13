import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { sendPulseAuth } from '../common/auth';
import { mailingListId } from '../common/props';
import { Property } from '@activepieces/pieces-framework';

export const unsubscriberTrigger = createTrigger({
  name: 'unsubscriber',
  displayName: 'New Unsubscriber',
  description: 'Fires when one or more subscribers are removed or unsubscribed from a list.',
  auth: sendPulseAuth,
  props: {
    addressBookId: mailingListId,
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const { addressBookId } = context.propsValue;
    await context.store.put('sendpulse-unsubscribe-list-id', String(addressBookId));
  },
  async onDisable(context) {
    await context.store.delete('sendpulse-unsubscribe-list-id');
  },
  async run(context) {
    const storedListId = await context.store.get('sendpulse-unsubscribe-list-id');
    const payload = context.payload.body;
    const now = new Date().toISOString();
    const items = Array.isArray(payload) ? payload : [payload];
    const seen = new Set();
    const normalized = [];
    for (const item of items) {
      if (!item) continue;
      const incomingListId = item.addressbook_id ?? item.book_id ?? item.addressBookId ?? item.address_book_id;
      if (storedListId && String(incomingListId) !== String(storedListId)) continue;
      const eventType = item.event ?? item.type ?? '';
      if (!['unsubscribe', 'removed'].includes(String(eventType).toLowerCase())) continue;
      const id = item.email || item.phone || now;
      if (seen.has(id)) continue;
      seen.add(id);
      const unsubscribedAt = item.timestamp ? new Date(Number(item.timestamp) * 1000).toISOString() : now;
      normalized.push({
        id,
        email: item.email || null,
        phone: item.phone || null,
        addressBookId: incomingListId,
        unsubscribedAt,
        reason: item.reason || 'Unknown',
        rawEvent: item,
      });
    }
    return normalized;
  },
  async test() {
    const now = new Date().toISOString();
    return [
      {
        id: 'test-unsubscribe@example.com',
        email: 'test-unsubscribe@example.com',
        phone: null,
        addressBookId: 123456,
        unsubscribedAt: now,
        reason: 'User clicked unsubscribe',
        rawEvent: {
          email: 'test-unsubscribe@example.com',
          addressbook_id: 123456,
          event: 'unsubscribe',
          reason: 'User clicked unsubscribe',
        },
      },
      {
        id: '+1234567890',
        email: null,
        phone: '+1234567890',
        addressBookId: 123456,
        unsubscribedAt: now,
        reason: 'Manual removal',
        rawEvent: {
          phone: '+1234567890',
          addressbook_id: 123456,
          event: 'removed',
          reason: 'Manual removal',
        },
      },
    ];
  },
  sampleData: {
    id: 'unsub@example.com',
    email: 'unsub@example.com',
    phone: null,
    addressBookId: 123456,
    unsubscribedAt: '2025-07-13T12:00:00.000Z',
    reason: 'Manual removal',
    rawEvent: {
      email: 'unsub@example.com',
      addressbook_id: 123456,
      event: 'unsubscribe',
      reason: 'Manual removal',
    },
  },
}); 