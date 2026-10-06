import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { dripAuth } from '../auth';
import { dripCommon } from '../common';
import { dripSamples } from '../common/samples';
import { dripWebhook } from '../common/webhook';
import { dripOutputSchemas } from '../output-schemas';

const STORE_KEY = 'drip_email_clicked_trigger';
const EVENT = 'subscriber.clicked_email';

export const dripEmailClickedEvent = createTrigger({
  auth: dripAuth,
  name: 'email_clicked',
  classification: 'READ',
  displayName: 'Email Link Clicked',
  description: 'Triggers when a subscriber clicks a link in a Drip email. Can be high volume.',
  aiMetadata: {
    description: 'Fires when a subscriber clicks a link in a Drip email in the selected account (Drip event subscriber.clicked_email); data.properties has the URL, email subject and email ID. Can fire often on large lists.',
  },
  props: {
    account_id: dripCommon.account_id,
  },
  sampleData: dripSamples.event({ name: EVENT, properties: { delivery_id: '99999', email_id: '88888', url: 'https://www.example.com', email_subject: 'Welcome to the course' } }),
  outputSchema: dripOutputSchemas.clickEvent,
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
