import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { sendPulseAuth } from '../common/auth';
import { mailingListId } from '../common/props';
import { Property } from '@activepieces/pieces-framework';

export const newSubscriberTrigger = createTrigger({
  name: 'new_subscriber',
  displayName: 'New Subscriber',
  description: 'Fires when one or more new subscribers are added to a mailing list.',
  auth: sendPulseAuth,
  props: {
    addressBookId: mailingListId,
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const { addressBookId } = context.propsValue;
    await context.store.put('sendpulse-mailing-list-id', String(addressBookId));
  },
  async onDisable(context) {
    await context.store.delete('sendpulse-mailing-list-id');
  },
  async run(context) {
    const storedListId = await context.store.get('sendpulse-mailing-list-id');
    const payload = context.payload.body;
    const now = new Date().toISOString();
    const items = Array.isArray(payload) ? payload : [payload];
    const normalized = [];
    for (const item of items) {
      if (!item || !item.email) continue;
      const incomingListId = item.addressbook_id ?? item.book_id ?? item.addressBookId ?? item.address_book_id;
      if (storedListId && String(incomingListId) !== String(storedListId)) continue;
      const id = item.email;
      normalized.push({
        id,
        email: item.email,
        addressBookId: incomingListId,
        addedAt: now,
        raw: item,
      });
    }
    return normalized;
  },
  async test() {
    const now = new Date().toISOString();
    return [
      {
        id: 'demo@example.com',
        email: 'demo@example.com',
        addressBookId: 123456,
        addedAt: now,
        raw: {
          email: 'demo@example.com',
          addressbook_id: 123456,
        },
      },
    ];
  },
  sampleData: {
    id: 'subscriber@example.com',
    email: 'subscriber@example.com',
    addressBookId: 123456,
    addedAt: '2025-07-13T10:00:00.000Z',
    raw: {
      email: 'subscriber@example.com',
      addressbook_id: 123456,
    },
  },
}); 