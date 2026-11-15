import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { firefliesAiAuth } from '../auth';
import { firefliesWebhook, MEETING_SAMPLE_DATA, TRANSCRIBED_EVENT } from '../common/webhook';
import { firefliesOutputSchemas } from '../output-schemas';

export const newTranscriptionCompletedTrigger = createTrigger({
  auth: firefliesAiAuth,
  name: 'new_transcription_completed',
  classification: 'READ',
  displayName: 'New Transcription Completed',
  description:
    'Triggered when a new meeting is transcribed. The summary may still be processing at this point; use Meeting Summarized if you need it. A resend from Fireflies after notes change fires again, and in rare cases a delivery may fire twice.',
  aiMetadata: {
    description:
      'Fires once per meeting when Fireflies finishes transcribing it (Webhooks V2 meeting.transcribed, or a legacy V1 webhook), emitting the meeting with speakers, attendees, media URLs and whatever summary exists yet. Requires a manually added Fireflies webhook.',
  },
  props: {
    webhookInstructions: Property.MarkDown({
      value: firefliesWebhook.setupInstructions({ eventName: TRANSCRIBED_EVENT }),
    }),
    signing_secret: firefliesWebhook.signingSecretProp(),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: MEETING_SAMPLE_DATA,
  outputSchema: firefliesOutputSchemas.newTranscriptionCompleted,
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
      targetEvent: TRANSCRIBED_EVENT,
    });
  },
});
