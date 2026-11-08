import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { retellAiAuth } from '../common/auth';
import { apiKeyOf } from '../common/client';
import { SAMPLE_CALL_ENDED } from '../common/sample';
import { retellSchemas } from '../common/schemas';
import { handleRetellWebhook, webhookInstructions } from '../common/webhook';

export const callEndedTrigger = createTrigger({
  auth: retellAiAuth,
  name: 'call_ended',
  classification: 'READ',
  displayName: 'Call Ended',
  description: 'Triggers when a call ends (call_ended event), with transcript and recording.',
  aiMetadata: {
    description:
      'Fires once per Retell call when it ends, is transferred or fails to connect (call_ended webhook event). Payload is {event, call} with status, timestamps, duration, disconnection reason, transcript and recording URL; post-call analysis is not included yet (use Call Analyzed for it). Requires the account webhook URL set manually in Retell and a connection key with the webhook badge.',
  },
  props: {
    webhookInstructions: webhookInstructions('call_ended'),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: SAMPLE_CALL_ENDED,
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
      event: 'call_ended',
      nowMs: Date.now(),
    });
  },
});
