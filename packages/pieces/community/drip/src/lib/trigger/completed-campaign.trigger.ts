import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { dripAuth } from '../auth';
import { dripCommon } from '../common';
import { dripSamples } from '../common/samples';
import { dripWebhook } from '../common/webhook';
import { dripOutputSchemas } from '../output-schemas';

const STORE_KEY = 'drip_completed_campaign_trigger';
const EVENT = 'subscriber.completed_campaign';

export const dripCompletedCampaignEvent = createTrigger({
  auth: dripAuth,
  name: 'completed_campaign',
  classification: 'READ',
  displayName: 'Completed Email Series',
  description: 'Triggers when a subscriber completes an Email Series Campaign.',
  aiMetadata: {
    description: 'Fires when a subscriber receives the last email of an Email Series Campaign in the selected Drip account (Drip event subscriber.completed_campaign), optionally only for one campaign; data.properties has campaign_id and campaign_name.',
  },
  props: {
    account_id: dripCommon.account_id,
    campaign_id: dripCommon.campaign_id({ required: false, description: 'Only trigger for this email series. Leave empty for all.' }),
  },
  sampleData: dripSamples.event({ name: EVENT, properties: { campaign_id: '123456', campaign_name: 'Welcome series' } }),
  outputSchema: dripOutputSchemas.campaignEvent,
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
      matches: (body) => campaignMatches({ expected: context.propsValue.campaign_id, body }),
    });
  },
});

function campaignMatches({ expected, body }: { expected: unknown; body: Record<string, unknown> }): boolean {
  if (expected === undefined || expected === null || String(expected).trim() === '') {
    return true;
  }
  return String(dripWebhook.propertiesOf(body)['campaign_id'] ?? '') === String(expected).trim();
}
