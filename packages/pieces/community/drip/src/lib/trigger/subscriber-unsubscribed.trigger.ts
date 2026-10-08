import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { dripAuth } from '../auth';
import { dripCommon } from '../common';
import { dripSamples } from '../common/samples';
import { dripWebhook } from '../common/webhook';
import { dripOutputSchemas } from '../output-schemas';

const STORE_KEY = 'drip_subscriber_unsubscribed_trigger';
const EVENT = 'subscriber.unsubscribed_all';

export const dripSubscriberUnsubscribedEvent = createTrigger({
  auth: dripAuth,
  name: 'subscriber_unsubscribed',
  classification: 'READ',
  displayName: 'Subscriber Unsubscribed From All',
  description: 'Triggers when a subscriber unsubscribes from all mailings.',
  aiMetadata: {
    description: 'Fires when a subscriber in the selected Drip account is unsubscribed from all mailings (Drip event subscriber.unsubscribed_all), with the subscriber profile. Represents a contact opting out.',
  },
  props: {
    account_id: dripCommon.account_id,
  },
  sampleData: dripSamples.event({ name: EVENT, properties: {} }),
  outputSchema: dripOutputSchemas.subscriberEvent,
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    await dripWebhook.enable({
      token: context.auth.secret_text,
      accountId: context.propsValue.account_id,
      webhookUrl: context.webhookUrl,
      store: context.store,
      storeKey: STORE_KEY,
      event: EVENT,
    });
  },
  async onDisable(context) {
    await dripWebhook.disable({ token: context.auth.secret_text, store: context.store, storeKey: STORE_KEY });
  },
  async run(context) {
    return dripWebhook.handle({ token: context.auth.secret_text, store: context.store, storeKey: STORE_KEY, event: EVENT, payload: context.payload });
  },
});
