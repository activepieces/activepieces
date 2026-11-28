import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { inklyAuth } from '../auth';
import { inklyOutput } from '../common/output';
import { inklySampleData } from '../common/sample-data';
import { inklyWebhook } from '../common/webhook';
import { inklyOutputSchemas } from '../output-schemas';

export const documentSentTrigger = createTrigger({
  auth: inklyAuth,
  name: 'document_sent',
  classification: 'READ',
  displayName: 'Document Sent',
  description: 'Triggers when a document is sent for signature.',
  aiMetadata: {
    description: 'Fires once each time an Inkly document is sent for signature, with the document and its recipients.',
  },
  outputSchema: inklyOutputSchemas.documentSent,
  props: {},
  sampleData: inklySampleData.sent,
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    await inklyWebhook.enable({
      apiKey: context.auth.secret_text,
      webhookUrl: context.webhookUrl,
      event: EVENT,
      store: context.store,
    });
  },
  async onDisable(context) {
    await inklyWebhook.disable({ apiKey: context.auth.secret_text, store: context.store });
  },
  async test(context) {
    const events = await inklyWebhook.samples({ apiKey: context.auth.secret_text, event: EVENT });
    return events.map(({ eventId, item }) =>
      inklyOutput.event({ eventId, eventType: EVENT, item, withFieldValues: false }),
    );
  },
  async run(context) {
    const received = await inklyWebhook.receive({
      apiKey: context.auth.secret_text,
      event: EVENT,
      store: context.store,
      payload: context.payload,
    });
    if (!received) {
      return [];
    }
    return [inklyOutput.event({ eventId: received.eventId, eventType: EVENT, item: received.item, withFieldValues: false })];
  },
});

const EVENT = 'document.sent';
