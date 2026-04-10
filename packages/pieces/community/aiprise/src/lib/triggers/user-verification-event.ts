import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { aipriseAuth } from '../../';

export const userVerificationEventTrigger = createTrigger({
  auth: aipriseAuth,
  name: 'user_verification_event',
  displayName: 'Identity Verification Step Updated',
  description:
    'Fires each time a step in the identity check progresses — for example when the person uploads their ID, completes the selfie, or when a check passes or fails. Useful for building real-time status dashboards or notifications.',
  props: {
    instructions: Property.MarkDown({
      value: `### How to connect this trigger to AiPrise

1. **Enable** this trigger to generate a Webhook URL (shown above the flow builder).
2. Copy that URL.
3. In the **Start Identity Verification** action, paste the URL into the **Events Callback URL** field.
4. AiPrise will now call this flow each time the person completes a step (document upload, face scan, etc.).`,
    }),
  },
  sampleData: {
    event_type: 'document_uploaded',
    session_id: 'sess_abc123',
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(_context) {
    // AiPrise uses a per-request events_callback_url rather than a registered webhook endpoint.
  },

  async onDisable(_context) {
    // No deregistration needed.
  },

  async run(context) {
    const payload = context.payload.body as Record<string, unknown>;
    return [payload];
  },
});
