import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { retellAiAuth } from '../common/auth';
import { apiKeyOf } from '../common/client';
import { SAMPLE_CALL_STARTED } from '../common/sample';
import { retellSchemas } from '../common/schemas';
import { handleRetellWebhook, webhookInstructions } from '../common/webhook';

export const newCallTrigger = createTrigger({
  auth: retellAiAuth,
  name: 'new_call',
  classification: 'READ',
  displayName: 'New Call',
  description: 'Triggers when an inbound or outbound call starts (call_started event).',
  aiMetadata: {
    description:
      'Fires once per Retell call when it starts (call_started webhook event), inbound or outbound. Payload is {event, call} with the call ID, numbers, direction, agent and metadata; no transcript yet. Requires the account webhook URL set manually in Retell and a connection key with the webhook badge.',
  },
  props: {
    webhookInstructions: webhookInstructions('call_started'),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: SAMPLE_CALL_STARTED,
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
      event: 'call_started',
      nowMs: Date.now(),
    });
  },
});
