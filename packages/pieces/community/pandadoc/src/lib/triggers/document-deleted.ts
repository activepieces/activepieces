import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { pandadocAuth } from '../common/auth';
import { pandadocSchemas } from '../common/schemas';
import { pandadocWebhook } from '../common/webhook';
import { pandadocSampleEvent } from './sample-data';

export const documentDeleted = createTrigger({
  auth: pandadocAuth,
  name: 'document_deleted',
  classification: 'READ',
  displayName: 'Document Deleted',
  description: 'Triggers when a document is deleted.',
  aiMetadata: {
    description: 'Fires when a PandaDoc document is deleted. Delivers the ID, name and last known status of the deleted document.',
  },
  props: {},
  sampleData: { ...pandadocSampleEvent, event: 'document_deleted' },
  outputSchema: pandadocSchemas['webhookEvent'],
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    await pandadocWebhook.subscribe({
      apiKey: context.auth.secret_text,
      webhookUrl: context.webhookUrl,
      name: 'Document Deleted',
      events: EVENTS,
      store: context.store,
      storeKey: STORE_KEY,
    });
  },
  async onDisable(context) {
    await pandadocWebhook.unsubscribe({ apiKey: context.auth.secret_text, store: context.store, storeKey: STORE_KEY });
  },
  async run(context) {
    return pandadocWebhook.receive({ payload: context.payload, store: context.store, storeKey: STORE_KEY, events: EVENTS });
  },
});

const EVENTS = ['document_deleted'];
const STORE_KEY = 'pandadoc_document_deleted_webhook';
