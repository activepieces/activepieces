import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { inklyAuth } from '../auth';
import { inklyOutput } from '../common/output';
import { inklySampleData } from '../common/sample-data';
import { inklyWebhook } from '../common/webhook';
import { inklyOutputSchemas } from '../output-schemas';

export const signerSignedTrigger = createTrigger({
  auth: inklyAuth,
  name: 'signer_signed',
  classification: 'READ',
  displayName: 'Signer Signed',
  description: 'Triggers when one signer signs a document, even if others still need to sign.',
  aiMetadata: {
    description:
      'Fires once for each signer who signs an Inkly document, before the document is complete. Use Document Completed to wait for everyone.',
  },
  outputSchema: inklyOutputSchemas.signerSigned,
  props: {},
  sampleData: inklySampleData.signed,
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
    return events.map(({ eventId, item, signer }) =>
      inklyOutput.event({ eventId, eventType: EVENT, item, signer, withFieldValues: false }),
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
    return [
      inklyOutput.event({
        eventId: received.eventId,
        eventType: EVENT,
        item: received.item,
        signer: received.signer,
        withFieldValues: false,
      }),
    ];
  },
});

const EVENT = 'recipient.signed';
