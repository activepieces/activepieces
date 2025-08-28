import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { avomaAuth, avomaCommon } from '../common';

export const newMeetingScheduled = createTrigger({
  auth: avomaAuth,
  name: 'newMeetingScheduled',
  displayName: 'New Meeting Scheduled',
  description:
    'Triggers when a meeting is booked via one of your Avoma scheduling pages.',
  props: {},
  sampleData: {
    booker_email: 'string',
    cancel_reason: 'string',
    conference_link: 'string',
    created: '2019-08-24T14:15:22Z',
    event_end_time: '2019-08-24T14:15:22Z',
    event_start_time: '2019-08-24T14:15:22Z',
    event_type: 'MEETING_BOOKED_VIA_SCHEDULER',
    invitee_details: {
      email: 'user@example.com',
      locale: 'string',
      name: 'string',
      tz: 'string',
    },
    invitee_responses: [
      {
        question: 'string',
        response: 'string',
      },
    ],
    meeting_uuid: '65fb768c-30b9-4a9a-999f-5dab85e66635',
    modified: '2019-08-24T14:15:22Z',
    organizer_email: 'user@example.com',
    organizer_timezone: 'string',
    purpose: 'string',
    scheduling_page_link: 'string',
    subject: 'string',
    uuid: '095be615-a8ad-4c33-8e9c-c7612fbf6c9f',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    // Webhook is registered with avoma's support
  },
  async onDisable(context) {
    // Webhook is registered with avoma's support
  },
  async run(context) {
    if (
      avomaCommon.isWebhookSignatureValid({
        apiKey: context.auth,
        body: context.payload.body,
        headers: context.payload.headers,
      })
    ) {
      return [context.payload.body];
    } else {
      return [];
    }
  },
});
