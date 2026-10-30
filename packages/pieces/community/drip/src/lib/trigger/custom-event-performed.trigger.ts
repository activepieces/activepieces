import { Property, createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { dripAuth } from '../auth';
import { dripCommon } from '../common';
import { dripSamples } from '../common/samples';
import { dripWebhook } from '../common/webhook';
import { dripOutputSchemas } from '../output-schemas';

const STORE_KEY = 'drip_custom_event_performed_trigger';
const EVENT = 'subscriber.performed_custom_event';

export const dripCustomEventPerformedEvent = createTrigger({
  auth: dripAuth,
  name: 'custom_event_performed',
  classification: 'READ',
  displayName: 'Custom Event Performed',
  description: 'Triggers when a custom event is recorded for a subscriber.',
  aiMetadata: {
    description: 'Fires when a custom event (such as "Logged in") is recorded for a subscriber in the selected Drip account (Drip event subscriber.performed_custom_event), optionally only for one event name; data.properties has the action and its properties.',
  },
  props: {
    account_id: dripCommon.account_id,
    action: Property.ShortText({ displayName: 'Event Action', description: 'Only trigger for this event name (not case-sensitive). Leave empty for every custom event.', required: false }),
  },
  sampleData: dripSamples.event({ name: EVENT, properties: { action: 'Logged in', plan: 'pro' } }),
  outputSchema: dripOutputSchemas.customEvent,
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
    return dripWebhook.handle({
      token: context.auth.secret_text,
      store: context.store,
      storeKey: STORE_KEY,
      event: EVENT,
      payload: context.payload,
      matches: (body) => dripWebhook.textMatches({ expected: context.propsValue.action, actual: dripWebhook.propertiesOf(body)['action'] }),
    });
  },
});
