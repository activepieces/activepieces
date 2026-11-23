import { createTrigger, OutputSchema, TriggerStrategy } from '@activepieces/pieces-framework';
import { sendpulseAuth } from '../common/auth';
import { createWebhook, deleteWebhook, epochToIso, parseMailingListId, readWebhookEvents, readWebhookEmail } from '../common/client';
import { mailingListDropdown } from '../common/props';

const WEBHOOK_ACTION = 'new_emails';

const sampleData = {
  id: 'subscriber@example.com_1496827625',
  email: 'subscriber@example.com',
  mailingListId: '123456',
  source: 'subscription form',
  variables: {
    name: 'John Doe',
  },
  addedAt: '2017-06-07T09:27:05.000Z',
  timestamp: '1496827625',
};

const outputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Event ID' },
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'mailingListId', label: 'Mailing List ID' },
    { key: 'source', label: 'Source' },
    { key: 'variables', label: 'Variables' },
    { key: 'addedAt', label: 'Added At', format: 'datetime' },
    { key: 'timestamp', label: 'Unix Timestamp' },
  ],
};

export const newSubscriberTrigger = createTrigger({
  auth: sendpulseAuth,
  name: 'new_subscriber',
  classification: 'READ',
  displayName: 'New Subscriber',
  description: 'Fires when new subscriber is added',
  aiMetadata: {
    description: 'Fires when a new email contact is added to the selected SendPulse mailing list (address book), via any source such as a subscription form or import. Each event represents one newly added subscriber and includes their email, source, and variables.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {
    mailingListId: mailingListDropdown,
  },
  outputSchema,
  async onEnable(context) {
    parseMailingListId(context.propsValue.mailingListId);
    const webhookId = await createWebhook({ auth: context.auth.props, url: context.webhookUrl, action: WEBHOOK_ACTION });
    await context.store.put('webhook_id', webhookId);
  },

  async onDisable(context) {
    const webhookId = await context.store.get<string | number>('webhook_id');
    if (webhookId !== null && webhookId !== undefined) {
      await deleteWebhook({ auth: context.auth.props, webhookId: String(webhookId) });
    }
    await context.store.delete('webhook_id');
    await context.store.delete('mailing_list_id');
  },

  async run(context) {
    const listId = parseMailingListId(context.propsValue.mailingListId);
    return readWebhookEvents(context.payload.body)
      .filter((item) => item['event'] === WEBHOOK_ACTION && String(item['book_id']) === listId)
      .map((item) => {
        const email = readWebhookEmail(item);
        const timestamp = item['timestamp'] === undefined || item['timestamp'] === null ? '' : String(item['timestamp']);
        return {
          id: `${email}_${timestamp}`,
          email,
          mailingListId: String(item['book_id']),
          source: item['source'] ?? null,
          variables: item['variables'] ?? {},
          addedAt: epochToIso(item['timestamp']),
          timestamp,
        };
      });
  },

  async test() {
    return [sampleData];
  },

  sampleData,
});
