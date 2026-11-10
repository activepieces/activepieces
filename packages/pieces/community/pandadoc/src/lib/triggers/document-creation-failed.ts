import { createTrigger, DEDUPE_KEY_PROPERTY, TriggerStrategy } from '@activepieces/pieces-framework';
import { pandadocAuth } from '../common/auth';
import { pandadocSchemas } from '../common/schemas';
import { pandadocWebhook } from '../common/webhook';
import { pandadocCreationFailedSample } from './sample-data';

export const documentCreationFailed = createTrigger({
  auth: pandadocAuth,
  name: 'document_creation_failed',
  classification: 'READ',
  displayName: 'Document Creation Failed',
  description: 'Triggers when PandaDoc fails to create a document requested through the API (for example a bad file or missing field values).',
  aiMetadata: {
    description:
      'Fires when PandaDoc could not finish creating a document that was requested asynchronously, so the document never reaches draft. Use it to alert someone or retry with corrected input.',
  },
  props: {},
  sampleData: pandadocCreationFailedSample,
  outputSchema: pandadocSchemas['creationFailedEvent'],
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    await pandadocWebhook.subscribe({
      apiKey: context.auth.secret_text,
      webhookUrl: context.webhookUrl,
      name: 'Document Creation Failed',
      events: EVENTS,
      store: context.store,
      storeKey: STORE_KEY,
    });
  },
  async onDisable(context) {
    await pandadocWebhook.unsubscribe({ apiKey: context.auth.secret_text, store: context.store, storeKey: STORE_KEY });
  },
  async run(context) {
    const items = await pandadocWebhook.receive({ payload: context.payload, store: context.store, storeKey: STORE_KEY, events: EVENTS });
    return items.map((item) => ({ event: item.event, id: item.id, error_type: item.error_type, error_detail: item.error_detail, ...dedupeKey(item) }));
  },
});

function dedupeKey(item: object): Record<string, unknown> {
  const key: unknown = Reflect.get(item, DEDUPE_KEY_PROPERTY);
  return key === undefined ? {} : { [DEDUPE_KEY_PROPERTY]: key };
}

const EVENTS = ['document_creation_failed'];
const STORE_KEY = 'pandadoc_document_creation_failed_webhook';
