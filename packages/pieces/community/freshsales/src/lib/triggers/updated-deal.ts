import { pollingHelper } from '@activepieces/pieces-common';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { freshsalesAuth } from '../auth';
import { freshsalesPolling } from '../common/record-polling';
import { dealOutputSchema } from '../output-schemas';

export const updatedDeal = createTrigger({
  auth: freshsalesAuth,
  name: 'updated_deal',
  displayName: 'Updated Deal',
  description: 'Triggers when a deal is created or updated (e.g. stage change)',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fires when a Freshsales deal is updated, including stage changes (new deals also count). Polls the All deals view sorted by update time; each event is the deal as it is now.',
  },
  outputSchema: dealOutputSchema,
  type: TriggerStrategy.POLLING,
  props: {},
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  sampleData: {
    id: 16000234567,
    name: 'Acme renewal 2026',
    amount: '12000.0',
    currency_id: 1,
    deal_pipeline_id: 16000000300,
    deal_stage_id: 16000000301,
    sales_account_id: 16000000100,
    owner_id: 16000000001,
    expected_close: '2026-12-31',
    probability: 60,
    created_at: '2026-10-22T10:00:00Z',
    updated_at: '2026-10-22T10:05:00Z',
    custom_field: {},
  },
});

const polling = freshsalesPolling.buildPolling({
  entity: 'deals',
  timestampField: 'updated_at',
});
