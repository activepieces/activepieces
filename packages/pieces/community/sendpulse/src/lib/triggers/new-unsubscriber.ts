import { createTrigger, OutputSchema, TriggerStrategy } from '@activepieces/pieces-framework';
import { sendpulseAuth } from '../common/auth';
import { createWebhook, deleteWebhook, epochToIso, parseMailingListId, readWebhookEvents, readWebhookEmail } from '../common/client';
import { mailingListDropdown } from '../common/props';

const WEBHOOK_ACTION = 'unsubscribe';

const sampleData = {
  id: 'unsub@example.com_1496827872',
  email: 'unsub@example.com',
  mailingListId: '123456',
  taskId: '3668141',
  fromAll: false,
  reason: 'Manual unsubscribe',
  categories: 'newsletter',
  unsubscribedAt: '2017-06-07T09:31:12.000Z',
  timestamp: '1496827872',
};

const outputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Event ID' },
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'mailingListId', label: 'Mailing List ID' },
    { key: 'taskId', label: 'Campaign Task ID' },
    { key: 'fromAll', label: 'Unsubscribed From All', format: 'boolean' },
    { key: 'reason', label: 'Reason' },
    { key: 'categories', label: 'Categories' },
    { key: 'unsubscribedAt', label: 'Unsubscribed At', format: 'datetime' },
    { key: 'timestamp', label: 'Unix Timestamp' },
  ],
};

export const newUnsubscriberTrigger = createTrigger({
  auth: sendpulseAuth,
  name: 'new_unsubscriber',
  classification: 'READ',
  displayName: 'New Unsubscriber',
  description: 'Fires when subscriber unsubscribes',
  aiMetadata: {
    description: 'Fires when a contact unsubscribes from the selected SendPulse mailing list (address book). Each event represents one unsubscribe and includes the email, the reason if provided, and whether they opted out of all lists.',
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
        const reason = item['reason'];
        return {
          id: `${email}_${timestamp}`,
          email,
          mailingListId: String(item['book_id']),
          taskId: item['task_id'] === undefined || item['task_id'] === null ? null : String(item['task_id']),
          fromAll: String(item['from_all']) === '1' || item['from_all'] === true,
          reason: typeof reason === 'string' && reason.length > 0 ? reason : 'No reason provided',
          categories: typeof item['categories'] === 'string' ? item['categories'] : '',
          unsubscribedAt: epochToIso(item['timestamp']),
          timestamp,
        };
      });
  },

  async test() {
    return [sampleData];
  },

  sampleData,
});
