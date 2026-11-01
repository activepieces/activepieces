import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { lemlistAuth } from '../common/constants';
import { LEMLIST_UNSUBSCRIBE_TYPES } from '../common/events';
import { SAMPLE_UNSUBSCRIBE } from '../common/sample';
import { lemlistSchemas } from '../common/schemas';
import { lemlistWebhook } from '../common/webhook';

const CACHE_KEY = 'lemlist_unsubscribed_recipient_trigger_key';

export const unsubscribedRecipient = createTrigger({
  auth: lemlistAuth,
  name: 'unsubscribedRecipient',
  classification: 'READ',
  displayName: 'Unsubscribed Recipient',
  description: 'Triggers when a recipient unsubscribes.',
  aiMetadata: {
    description:
      'Fires once per lemlist unsubscribe event delivered by webhook: a contact unsubscribed (entityUnsubscribed), one of its emails/phones/LinkedIn was unsubscribed (variableUnsubscribed), or a lead stopped because it is on the unsubscribe list (emailsUnsubscribed, apiUnsubscribed, manualUnsubscribed). Deliveries are checked against a webhook secret and duplicates dropped by activity ID. Payload is the activity record.',
  },
  props: {},
  sampleData: SAMPLE_UNSUBSCRIBE,
  outputSchema: lemlistSchemas.activity,
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    await lemlistWebhook.enable({
      apiKey: context.auth.secret_text,
      targetUrl: context.webhookUrl,
      store: context.store,
      storeKey: CACHE_KEY,
    });
  },
  async onDisable(context) {
    await lemlistWebhook.disable({
      apiKey: context.auth.secret_text,
      store: context.store,
      storeKey: CACHE_KEY,
    });
  },
  async run(context) {
    const activity = await lemlistWebhook.receive({
      body: context.payload.body,
      store: context.store,
      storeKey: CACHE_KEY,
      nowMs: Date.now(),
      accept: (event) => LEMLIST_UNSUBSCRIBE_TYPES.includes(String(event['type'])),
    });
    return activity === undefined ? [] : [activity];
  },
});
