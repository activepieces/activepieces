import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { retellAiAuth } from '../common/auth';
import { apiKeyOf } from '../common/client';
import { SAMPLE_CALL_ANALYZED } from '../common/sample';
import { retellSchemas } from '../common/schemas';
import { handleRetellWebhook, webhookInstructions } from '../common/webhook';

export const callAnalyzedTrigger = createTrigger({
  auth: retellAiAuth,
  name: 'call_analyzed',
  classification: 'READ',
  displayName: 'Call Analyzed',
  description: 'Triggers when post-call analysis is ready (call_analyzed event).',
  aiMetadata: {
    description:
      'Fires once per Retell call when post-call analysis finishes (call_analyzed webhook event). Payload is {event, call} with the full call, including transcript, call_analysis (summary, sentiment, success, custom extraction fields) and cost; the best trigger for CRM updates. Requires the account webhook URL set manually in Retell and a connection key with the webhook badge.',
  },
  props: {
    webhookInstructions: webhookInstructions('call_analyzed'),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: SAMPLE_CALL_ANALYZED,
  outputSchema: retellSchemas.webhookCall,
  async onEnable() {
    return;
  },
  async onDisable() {
    return;
  },
  async run(context) {
    return handleRetellWebhook({
      apiKey: apiKeyOf(context.auth),
      payload: context.payload,
      store: context.store,
      event: 'call_analyzed',
      nowMs: Date.now(),
    });
  },
});
