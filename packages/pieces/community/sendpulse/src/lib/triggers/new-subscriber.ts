import {
  createTrigger,
  TriggerStrategy,
  WebhookResponse,
} from '@activepieces/pieces-framework';
import { sendpulseAuth } from '../common/auth';
import { Property } from '@activepieces/pieces-framework';

export const newSubscriberTrigger = createTrigger({
  auth: sendpulseAuth,
  name: 'new_subscriber',
  displayName: 'New Subscriber',
  description: 'Triggers when a new subscriber is added to a mailing list.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    addressBookId: Property.Number({
      displayName: 'Mailing List ID',
      description: 'Select the mailing list to monitor',
      required: true,
    }),
  },

  async onEnable(context) {
    const { addressBookId } = context.propsValue;
    console.log(`Webhook enabled for mailing list ID: ${addressBookId}`);
    await context.store.put('sendpulse-mailing-list-id', String(addressBookId));
  },

  async onDisable(context) {
    console.log('Webhook disabled for New Subscriber');
  },

  async run(context) {
    const storedListId = await context.store.get('sendpulse-mailing-list-id');
    interface IncomingPayload {
      email: string;
      addressbook_id: number;
      [key: string]: any;
    }
    const incoming = context.payload.body as IncomingPayload;

    if (!incoming || !incoming.email || String(incoming.addressbook_id) !== storedListId) {
      return [];
    }

    return [
      {
        id: incoming.email,
        email: incoming.email,
        addressBookId: incoming.addressbook_id,
        addedAt: new Date().toISOString(),
        raw: incoming,
      },
    ];
  },

  async test() {
    return [
      {
        id: 'demo@example.com',
        email: 'demo@example.com',
        addressBookId: 123456,
        addedAt: new Date().toISOString(),
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
