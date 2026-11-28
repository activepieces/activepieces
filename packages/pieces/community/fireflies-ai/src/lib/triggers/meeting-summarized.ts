import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { firefliesAiAuth } from '../auth';
import { firefliesWebhook, MEETING_SAMPLE_DATA, SUMMARIZED_EVENT } from '../common/webhook';
import { firefliesOutputSchemas } from '../output-schemas';

export const meetingSummarizedTrigger = createTrigger({
  auth: firefliesAiAuth,
  name: 'meeting_summarized',
  classification: 'READ',
  displayName: 'Meeting Summarized',
  description:
    'Triggered when Fireflies finishes the AI summary of a meeting. A resend from Fireflies after notes change fires again, and in rare cases a delivery may fire twice.',
  aiMetadata: {
    description:
      'Fires once per meeting when Fireflies finishes its AI summary (Webhooks V2 meeting.summarized), emitting the meeting with its summary, speakers, attendees and media URLs. Requires a manually added Fireflies Webhooks V2 webhook.',
  },
  props: {
    webhookInstructions: Property.MarkDown({
      value: firefliesWebhook.setupInstructions({ eventName: SUMMARIZED_EVENT }),
    }),
    signing_secret: firefliesWebhook.signingSecretProp(),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: MEETING_SAMPLE_DATA,
  outputSchema: firefliesOutputSchemas.meetingSummarized,
  async onEnable() {
    return;
  },
  async onDisable() {
    return;
  },
  async test(context) {
    return firefliesWebhook.latestMeetings({ apiKey: context.auth });
  },
  async run(context) {
    return firefliesWebhook.handleDelivery({
      apiKey: context.auth,
      payload: context.payload,
      store: context.store,
      signingSecret: context.propsValue.signing_secret,
      targetEvent: SUMMARIZED_EVENT,
    });
  },
});
