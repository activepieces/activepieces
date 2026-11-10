import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { dripAuth } from '../auth';
import { dripCommon } from '../common';
import { dripSamples } from '../common/samples';
import { dripWebhook } from '../common/webhook';
import { dripOutputSchemas } from '../output-schemas';

const STORE_KEY = 'drip_subscriber_deleted_trigger';
const EVENT = 'subscriber.deleted';

export const dripSubscriberDeletedEvent = createTrigger({
  auth: dripAuth,
  name: 'subscriber_deleted',
  classification: 'READ',
  displayName: 'Subscriber Deleted',
  description: 'Triggers when a subscriber is deleted from your Drip account.',
  aiMetadata: {
    description: 'Fires when a subscriber is deleted from the selected Drip account (Drip event subscriber.deleted), with the last known subscriber profile.',
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
