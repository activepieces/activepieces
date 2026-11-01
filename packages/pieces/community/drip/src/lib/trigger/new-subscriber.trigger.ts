import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { dripAuth } from '../auth';
import { dripCommon } from '../common';
import { dripSamples } from '../common/samples';
import { dripWebhook } from '../common/webhook';
import { dripOutputSchemas } from '../output-schemas';

const STORE_KEY = 'drip_new_subscriber_trigger';
const EVENT = 'subscriber.created';

export const dripNewSubscriberEvent = createTrigger({
  auth: dripAuth,
  name: 'new_subscriber',
  classification: 'READ',
  displayName: 'New Subscriber',
  description: 'Triggers when a subscriber is created in your Drip account.',
  aiMetadata: {
    description: 'Fires when a new subscriber is created in the selected Drip account (Drip event subscriber.created), with the subscriber profile. Represents a contact being added to the list.',
  },
  props: {
    account_id: dripCommon.account_id,
  },
  sampleData: dripSamples.event({ name: EVENT }),
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
