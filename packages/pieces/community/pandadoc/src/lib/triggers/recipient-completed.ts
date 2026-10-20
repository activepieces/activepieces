import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { pandadocAuth } from '../common/auth';
import { folderFilterDropdown, templateFilterDropdown } from '../common/dynamic-dropdowns';
import { pandadocSchemas } from '../common/schemas';
import { pandadocWebhook } from '../common/webhook';
import { pandadocSampleEvent } from './sample-data';

export const recipientCompleted = createTrigger({
  auth: pandadocAuth,
  name: 'recipient_completed',
  classification: 'READ',
  displayName: 'Recipient Completed',
  description: 'Triggers when one recipient finishes their part of a document (signs or approves).',
  aiMetadata: {
    description:
      'Fires each time a single PandaDoc recipient completes their part of a document, before the whole document is necessarily complete. The action_by fields identify who finished. Optionally limited to specific templates or folders.',
  },
  props: {
    template_filter: templateFilterDropdown,
    folder_filter: folderFilterDropdown,
  },
  sampleData: {
    ...pandadocSampleEvent,
    event: 'recipient_completed',
    template_id: '5Hzwf88ZsNoiMesAMugaPR',
    template_name: 'Invoice',
    action_by_email: 'jane@example.com',
    action_by_first_name: 'Jane',
    action_by_last_name: 'Doe',
    action_date: '2026-10-20T20:36:10.247Z',
  },
  outputSchema: pandadocSchemas['webhookEvent'],
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    await pandadocWebhook.subscribe({
      apiKey: context.auth.secret_text,
      webhookUrl: context.webhookUrl,
      name: 'Recipient Completed',
      events: EVENTS,
      store: context.store,
      storeKey: STORE_KEY,
    });
  },
  async onDisable(context) {
    await pandadocWebhook.unsubscribe({ apiKey: context.auth.secret_text, store: context.store, storeKey: STORE_KEY });
  },
  async run(context) {
    return pandadocWebhook.receive({
      payload: context.payload,
      store: context.store,
      storeKey: STORE_KEY,
      events: EVENTS,
      select: (items) =>
        pandadocWebhook.filterItems({
          apiKey: context.auth.secret_text,
          items,
          templateIds: context.propsValue.template_filter,
          folderIds: context.propsValue.folder_filter,
        }),
    });
  },
});

const EVENTS = ['recipient_completed'];
const STORE_KEY = 'pandadoc_recipient_completed_webhook';
